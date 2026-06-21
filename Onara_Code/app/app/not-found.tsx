import { RecoverableError } from "@/components/system/RecoverableError";

export default function NotFound() {
  return (
    <RecoverableError
      homeHref="/dashboard"
      homeLabel="Open dashboard"
      message="That Onara page or project could not be found. It may have moved or been deleted."
      title="Page not found"
    />
  );
}
