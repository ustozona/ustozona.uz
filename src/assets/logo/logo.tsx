import { cn } from "@/lib/utils";
import { BrandWordmark } from "@/assets/logo/brand-wordmark";

type LogoProps = {
  className?: string;
};

const Logo = ({ className }: LogoProps) => {
  return (
    <BrandWordmark
      className={cn(className)}
      shieldClassName="size-8"
      textClassName="text-lg"
    />
  );
};

export default Logo;
