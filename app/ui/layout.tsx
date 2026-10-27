import { notFound } from "next/navigation";
import "./gallery.css";

export default function UiLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return children;
}
