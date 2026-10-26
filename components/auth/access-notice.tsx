import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ForgotPin } from "./forgot-pin";

export function AccessNotice({
  title,
  text,
  action,
  actionLabel,
  forgotPin = false,
}: {
  title: string;
  text: string;
  action: () => Promise<void>;
  actionLabel: string;
  forgotPin?: boolean;
}) {
  return (
    <Card>
      <div className="auth-title">
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      <form className="auth-form" action={action}>
        <Button type="submit">{actionLabel}</Button>
      </form>
      {forgotPin && <ForgotPin />}
    </Card>
  );
}
