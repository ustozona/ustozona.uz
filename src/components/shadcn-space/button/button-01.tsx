import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonWithIconProps = {
  children?: ReactNode;
  href?: string;
  className?: string;
};

const ButtonWithIcon = ({
  children = "Bepul boshlang",
  href,
  className,
}: ButtonWithIconProps) => {
  const content = (
    <>
      <span className="relative z-10 transition-all duration-500">
        {children}
      </span>
      <div className="absolute right-1 w-10 h-10 bg-background text-foreground rounded-full flex items-center justify-center transition-all duration-500 group-hover:right-[calc(100%-44px)] group-hover:rotate-45">
        <ArrowUpRight size={16} />
      </div>
    </>
  );

  return (
    <Button
      asChild={Boolean(href)}
      className={cn(
        "relative text-sm font-medium rounded-full h-12 p-1 ps-6 pe-14 group transition-all duration-500 hover:ps-14 hover:pe-6 w-fit overflow-hidden cursor-pointer",
        className,
      )}
    >
      {href ? <a href={href}>{content}</a> : content}
    </Button>
  );
};

export default ButtonWithIcon;
