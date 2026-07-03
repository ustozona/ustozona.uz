import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedTextRoller } from "@/components/shadcn-space/animated-text/animated-text-04";

type LogoProps = {
  className?: string;
};

const Logo = ({ className }: LogoProps) => {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center shrink-0">
        <GraduationCap className="w-5 h-5 text-background" strokeWidth={2} />
      </div>
      <span className="text-lg font-bold tracking-tight text-foreground">
        Ustozona
      </span>
      <AnimatedTextRoller className="-ml-0.5" />
    </div>
  );
};

export default Logo;
