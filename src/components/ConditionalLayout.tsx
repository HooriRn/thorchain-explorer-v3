"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import DefaultLayout from "./DefaultLayout";

interface ConditionalLayoutProps {
  children: ReactNode;
}

export default function ConditionalLayout({
  children,
}: ConditionalLayoutProps) {
  const pathname = usePathname();

  if (pathname.startsWith("/dashboard")) {
    return <>{children}</>;
  }

  return <DefaultLayout>{children}</DefaultLayout>;
}
