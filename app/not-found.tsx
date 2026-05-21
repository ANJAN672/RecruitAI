import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-6xl font-semibold tracking-tight text-neutral-900">404</p>
      <p className="text-neutral-500">The page you are looking for does not exist.</p>
      <Link href="/" className="btn-primary mt-2">
        Back to Requisitions
      </Link>
    </div>
  );
}
