import type { Icon, IconProps } from "@tabler/icons-react";
import {
  IconBolt,
  IconCar,
  IconCategory,
  IconChefHat,
  IconConfetti,
  IconDeviceDesktop,
  IconDroplet,
  IconEngine,
  IconHammer,
  IconMusic,
  IconPalette,
  IconPaw,
  IconShovel,
  IconSpray,
  IconTruck,
  IconWall,
} from "@tabler/icons-react";

/**
 * Icônes Tabler (MIT) par slug de catégorie.
 * Rendu « 2 tons » : trait couleur courante + remplissage de la même
 * couleur à faible opacité (voir DUOTONE_PROPS).
 */
const CATEGORY_ICONS: Record<string, Icon> = {
  plomberie: IconDroplet,
  mecanique: IconEngine,
  electricite: IconBolt,
  jardinage: IconShovel,
  menage: IconSpray,
  informatique: IconDeviceDesktop,
  cuisine: IconChefHat,
  transport: IconCar,
  irakiraka: IconWall,
  evenementiel: IconConfetti,
  animaux: IconPaw,
  bricolage: IconHammer,
  demenagement: IconTruck,
  arts: IconPalette,
  musiques: IconMusic,
};

export const DUOTONE_PROPS: Partial<IconProps> = {
  stroke: 1.8,
  fill: "currentColor",
  fillOpacity: 0.18,
};

interface CategoryIconProps {
  slug: string;
  size?: number;
  className?: string;
}

export default function CategoryIcon({
  slug,
  size = 28,
  className,
}: CategoryIconProps) {
  const IconComponent = CATEGORY_ICONS[slug] ?? IconCategory;
  return (
    <IconComponent
      size={size}
      className={className}
      aria-hidden
      {...DUOTONE_PROPS}
    />
  );
}
