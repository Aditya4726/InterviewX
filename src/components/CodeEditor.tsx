import { CODING_QUESTIONS, LANGUAGES } from "@/constants";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./ui/resizable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import {
  AlertCircleIcon,
  BookIcon,
  Code2Icon,
  LightbulbIcon,
  LoaderCircleIcon,
} from "lucide-react";
import Editor from "@monaco-editor/react";
import Image from "next/image";
import type { editor as MonacoEditor } from "monaco-editor";
import { useMutation, useQuery } from "convex/react";
import { useCall } from "@stream-io/video-react-sdk";
import { useUserRole } from "@/hooks/useUserRole";
import { api } from "../../convex/_generated/api";

type TestEditorState = {
  questionId: string;
  language: "javascript" | "python" | "java";
  code: string;
};

const TEST_EDITOR_EVENT = "interviewx-test-editor-v1";

function isSupportedLanguage(
  value: unknown
): value is TestEditorState["language"] {
  return value === "javascript" || value === "python" || value === "java";
}

function CodeEditor({
  callId,
  testMode = false,
}: {
  callId: string;
  testMode?: boolean;
}) {
  const [selectedQuestion, setSelectedQuestion] = useState(CODING_QUESTIONS[0]);
  const [language, setLanguage] = useState<"javascript" | "python" | "java">(
    LANGUAGES[0].id
  );
  const [code, setCode] = useState(selectedQuestion.starterCode[language]);
  const [copyPasteNotice, setCopyPasteNotice] = useState("");
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | undefined>(undefined);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const previousCodeRef = useRef(code);
  const updatingFromServerRef = useRef(false);
  const senderId = useId();
  const currentStateRef = useRef<TestEditorState>({
    questionId: selectedQuestion.id,
    language,
    code,
  });
  const call = useCall();
  const { isCandidate, isLoading: isRoleLoading } = useUserRole();
  const session = useQuery(
    api.codeSessions.getByStreamCallId,
    testMode ? "skip" : { streamCallId: callId }
  );
  const updateSession = useMutation(api.codeSessions.updateSession);

  const sendTestState = useCallback(
    (state: TestEditorState) => {
      if (!call) return;
      call
        .sendCustomEvent({
          appEvent: TEST_EDITOR_EVENT,
          callId,
          senderId,
          kind: "state",
          ...state,
        })
        .catch((error: unknown) =>
          console.error("Unable to sync test interview code:", error)
        );
    },
    [call, callId, senderId]
  );

  useEffect(() => {
    if (testMode) return;
    if (session === undefined) return;

    if (session === null) {
      const initialQuestion = CODING_QUESTIONS[0];
      const initialLanguage = LANGUAGES[0].id;
      updateSession({
        streamCallId: callId,
        questionId: initialQuestion.id,
        language: initialLanguage,
        code: initialQuestion.starterCode[initialLanguage],
      }).catch((error: unknown) => console.error("Unable to create code session:", error));
      return;
    }

    const question =
      CODING_QUESTIONS.find((item) => item.id === session.questionId) ??
      CODING_QUESTIONS[0];
    queueMicrotask(() => {
      updatingFromServerRef.current = true;
      setSelectedQuestion(question);
      setLanguage(session.language);
      setCode(session.code);
      previousCodeRef.current = session.code;
      if (editorRef.current?.getValue() !== session.code) {
        editorRef.current?.setValue(session.code);
      }
      updatingFromServerRef.current = false;
    });
  }, [session, callId, updateSession, testMode]);

  useEffect(() => {
    if (!testMode || !call) return;

    const unsubscribe = call.on("custom", (event) => {
      const payload = event.custom;
      if (
        payload.appEvent !== TEST_EDITOR_EVENT ||
        payload.callId !== callId ||
        payload.senderId === senderId
      ) {
        return;
      }

      if (payload.kind === "state_request") {
        sendTestState(currentStateRef.current);
        return;
      }

      const question =
        typeof payload.questionId === "string"
          ? CODING_QUESTIONS.find((item) => item.id === payload.questionId)
          : undefined;
      if (!question || !isSupportedLanguage(payload.language)) return;
      if (typeof payload.code !== "string") return;

      const nextState: TestEditorState = {
        questionId: question.id,
        language: payload.language,
        code: payload.code,
      };
      currentStateRef.current = nextState;
      updatingFromServerRef.current = true;
      setSelectedQuestion(question);
      setLanguage(nextState.language);
      setCode(nextState.code);
      previousCodeRef.current = nextState.code;
      if (editorRef.current?.getValue() !== nextState.code) {
        editorRef.current?.setValue(nextState.code);
      }
      updatingFromServerRef.current = false;
    });

    call
      .sendCustomEvent({
        appEvent: TEST_EDITOR_EVENT,
        callId,
        senderId,
        kind: "state_request",
      })
      .catch((error: unknown) =>
        console.error("Unable to request test interview code state:", error)
      );

    return unsubscribe;
  }, [call, callId, senderId, sendTestState, testMode]);

  const handleQuestionChange = (questionId: string) => {
    const question = CODING_QUESTIONS.find((q) => q.id === questionId)!;
    setSelectedQuestion(question);
    const nextCode = question.starterCode[language];
    setCode(nextCode);
    editorRef.current?.setValue(nextCode);
    const nextState = { questionId, language, code: nextCode };
    currentStateRef.current = nextState;
    if (testMode) {
      sendTestState(nextState);
    } else {
      updateSession({
        streamCallId: callId,
        questionId,
        code: nextCode,
      }).catch((error: unknown) =>
        console.error("Unable to sync question:", error)
      );
    }
  };

  const handleLanguageChange = (newLanguage: "javascript" | "python" | "java") => {
    setLanguage(newLanguage);
    const nextCode = selectedQuestion.starterCode[newLanguage];
    setCode(nextCode);
    editorRef.current?.setValue(nextCode);
    const nextState = {
      questionId: selectedQuestion.id,
      language: newLanguage,
      code: nextCode,
    };
    currentStateRef.current = nextState;
    if (testMode) {
      sendTestState(nextState);
    } else {
      updateSession({
        streamCallId: callId,
        language: newLanguage,
        code: nextCode,
      }).catch((error: unknown) =>
        console.error("Unable to sync language:", error)
      );
    }
  };

  const handleCodeChange = (nextCode: string | undefined) => {
    if (nextCode === undefined || updatingFromServerRef.current) return;
    setCode(nextCode);
    previousCodeRef.current = nextCode;
    currentStateRef.current = { ...currentStateRef.current, code: nextCode };

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (testMode) {
        sendTestState(currentStateRef.current);
        return;
      }
      updateSession({
        streamCallId: callId,
        code: nextCode,
      }).catch((error: unknown) =>
        console.error("Unable to sync code:", error)
      );
    }, 180);
  };

  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
  }, []);

  const showCopyPasteNotice = () => {
    setCopyPasteNotice("Copy, cut, and paste are disabled for candidates.");
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => setCopyPasteNotice(""), 2500);
  };

  return (
    <ResizablePanelGroup orientation="vertical" className="h-full min-h-0 bg-background">
      {/* QUESTION SECTION */}
      <ResizablePanel
        id="interview-question"
        defaultSize="42"
        minSize="25"
        maxSize="75"
        className="min-h-0"
      >
        <div className="h-full min-h-0 overflow-y-auto overscroll-contain">
          <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Interview challenge
                </p>
                <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  {selectedQuestion.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Choose your language and solve the problem
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select
                  value={selectedQuestion.id}
                  onValueChange={handleQuestionChange}
                >
                  <SelectTrigger className="min-w-0 flex-1 sm:w-48 sm:flex-none">
                    <SelectValue placeholder="Select question" />
                  </SelectTrigger>
                  <SelectContent>
                    {CODING_QUESTIONS.map((q) => (
                      <SelectItem key={q.id} value={q.id}>
                        {q.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-36 shrink-0">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <Image
                          src={`/${language}.png`}
                          alt={LANGUAGES.find((item) => item.id === language)?.name ?? language}
                          width={20}
                          height={20}
                          className="size-5 object-contain"
                        />
                        {LANGUAGES.find((item) => item.id === language)?.name}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.id} value={lang.id}>
                        <div className="flex items-center gap-2">
                          <Image
                            src={`/${lang.id}.png`}
                            alt={lang.name}
                            width={20}
                            height={20}
                            className="size-5 object-contain"
                          />
                          {lang.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* PROBLEM DESC. */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <BookIcon className="h-5 w-5 text-primary/80" />
                <CardTitle>Problem Description</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-line">{selectedQuestion.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* PROBLEM EXAMPLES */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <LightbulbIcon className="h-5 w-5 text-yellow-500" />
                <CardTitle>Examples</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedQuestion.examples.map((example, index) => (
                    <div key={index} className="space-y-2">
                      <p className="text-sm font-medium">Example {index + 1}</p>
                      <div className="space-y-2 overflow-x-auto rounded-md border bg-muted/30 p-3 font-mono text-sm">
                        <p className="whitespace-pre-wrap wrap-break-word">
                          <span className="font-semibold text-foreground">Input: </span>
                          {example.input}
                        </p>
                        <p className="whitespace-pre-wrap wrap-break-word">
                          <span className="font-semibold text-foreground">Output: </span>
                          {example.output}
                        </p>
                        {example.explanation && (
                          <p className="whitespace-pre-wrap wrap-break-word text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              Explanation:{" "}
                            </span>
                            {example.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CONSTRAINTS */}
            {selectedQuestion.constraints && (
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <AlertCircleIcon className="h-5 w-5 text-blue-500" />
                  <CardTitle>Constraints</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-inside list-disc space-y-1.5 text-sm marker:text-muted-foreground">
                    {selectedQuestion.constraints.map((constraint, index) => (
                      <li key={index} className="text-muted-foreground">
                        {constraint}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle
        withHandle
        aria-label="Resize the question and solution sections"
        title="Drag to resize question and solution"
        className="z-20 h-3 cursor-row-resize touch-none bg-transparent hover:bg-primary/10"
      />

      {/* CODE EDITOR */}
      <ResizablePanel
        id="interview-solution"
        defaultSize="58"
        minSize="25"
        maxSize="75"
        className="min-h-0"
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex h-10 shrink-0 items-center gap-2 border-b bg-muted/30 px-4 text-sm font-medium">
            <Code2Icon className="size-4 text-primary" />
            <span>Solution</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {LANGUAGES.find((item) => item.id === language)?.name}
            </span>
          </div>
          <div
            className="relative min-h-0 flex-1"
            onCopy={(event) => {
              if (isCandidate) {
                event.preventDefault();
                showCopyPasteNotice();
              }
            }}
            onCut={(event) => {
              if (isCandidate) {
                event.preventDefault();
                showCopyPasteNotice();
              }
            }}
            onPaste={(event) => {
              if (isCandidate) {
                event.preventDefault();
                showCopyPasteNotice();
              }
            }}
            onContextMenu={(event) => {
              if (isCandidate) event.preventDefault();
            }}
          >
            {isRoleLoading ? (
              <div className="grid h-full place-items-center">
                <LoaderCircleIcon className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
            <Editor
              height="100%"
              defaultLanguage={language}
              language={language}
              theme="vs-dark"
              value={code}
              onChange={handleCodeChange}
              onMount={(editorInstance, monaco) => {
                editorRef.current = editorInstance;

                if (isCandidate) {
                  editorInstance.addCommand(
                    monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC,
                    showCopyPasteNotice
                  );
                  editorInstance.addCommand(
                    monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX,
                    showCopyPasteNotice
                  );
                  editorInstance.addCommand(
                    monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV,
                    showCopyPasteNotice
                  );

                  editorInstance.onDidPaste(() => {
                    editorInstance.setValue(previousCodeRef.current);
                    showCopyPasteNotice();
                  });
                }
              }}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineHeight: 22,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 16, bottom: 16 },
                wordWrap: "on",
                wrappingIndent: "indent",
                contextmenu: !isCandidate,
              }}
            />
            )}
            {copyPasteNotice && (
              <div
                role="status"
                className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive shadow-lg"
              >
                {copyPasteNotice}
              </div>
            )}
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
export default CodeEditor;