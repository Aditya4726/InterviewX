"use client";

import Link from "next/link";
import { ModeToggle } from "./ModeToggle";
import { ArrowRightIcon, CodeIcon } from "lucide-react";
import { Show, UserButton } from "@clerk/nextjs";
import DashboardBtn from "./DasboardBtn";
import { Button, buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";

function Navbar() {
  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4 container mx-auto">
        {/* LEFT SIDE -LOGO */}
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-2xl mr-6 font-mono hover:opacity-80 transition-opacity"
        >
          <CodeIcon className="size-8 text-emerald-500" />
          <span className="bg-linear-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            InterviewX
          </span>
        </Link>

        <Show when="signed-out">
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/sign-in"
              className={cn(
                buttonVariants({ size: "default" }),
                "group relative h-10 gap-2 rounded-full px-5 font-semibold shadow-lg shadow-emerald-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-600/30"
              )}
            >
              Sign in
              <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <ModeToggle />
          </div>
        </Show>

        {/* RIGHT SIDE - ACTIONS */}
        <Show when="signed-in">
          <div className="ml-auto flex items-center gap-4">
            <DashboardBtn />
            <UserButton />
            <Link href="/sign-out">
              <Button variant="outline" size="sm">
                Sign out
              </Button>
            </Link>
            <ModeToggle />
          </div>
        </Show>
      </div>
    </nav>
  );
}
export default Navbar;