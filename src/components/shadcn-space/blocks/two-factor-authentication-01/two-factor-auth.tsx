import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const TwoFactorAuthForm = async () => {
  const t = await getTranslations("TwoFactorAuthPage");
  return (
    <section className="bg-foreground dark:bg-background min-h-screen relative flex items-center justify-center">
      <div className="pointer-events-none absolute inset-0 right-0 overflow-hidden md:block hidden">
        {/* Outer big circle */}
        <div className="absolute left-1/1 top-0 h-650 w-650 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10" />
        {/* Inner circle */}
        <div className="absolute left-1/1 top-0  h-175 w-175 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground dark:bg-background" />
      </div>

      <div className="py-10 md:py-20 max-w-lg px-4 sm:px-0 mx-auto w-full">
        <Card className="px-6 py-8 sm:p-12 relative gap-6">
          <CardHeader className="text-center gap-6 p-0">
            <div className="mx-auto">
              <a href="/" className="text-3xl font-bold tracking-tight">
                Ustozona
              </a>
            </div>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-2xl font-medium text-card-foreground">
                {t("title")}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground font-normal">
                {t("subtitle")}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <form>
              <FieldGroup className="gap-6">
                <div className="flex flex-col items-center gap-4">
                  <InputOTP maxLength={6} id="otp" required>
                    <InputOTPGroup className="gap-1 *:data-[slot=input-otp-slot]:rounded-xl *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:size-9">
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>

                  <Field className="gap-6">
                    <FieldDescription className="text-center text-sm font-normal text-muted-foreground">
                      {t("didntGetCode")}{" "}
                      <a
                        href="#"
                        className="font-medium text-card-foreground no-underline!"
                      >
                        {t("resend")}
                      </a>
                    </FieldDescription>
                    <Button type="submit" size={"lg"} className="rounded-lg h-10 hover:bg-primary/80 cursor-pointer">
                      {t("confirm")}
                    </Button>
                  </Field>
                </div>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default TwoFactorAuthForm;
