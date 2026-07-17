/**
 * Один переиспользуемый силуэт сидящего кролика:
 * тело-капля, два уха, хвост-точка.
 * solid — подтверждённый кролик (заливка акцентом),
 * ghost — возможный (только контур 1.5px, opacity 0.35).
 */
interface RabbitIconProps {
  variant: 'solid' | 'ghost';
  size?: number;
}

export function RabbitIcon({ variant, size = 30 }: RabbitIconProps) {
  const shapes = (
    <>
      <ellipse cx="15" cy="12" rx="3.2" ry="9" transform="rotate(-8 15 12)" />
      <ellipse cx="23" cy="11" rx="3.2" ry="9" transform="rotate(10 23 11)" />
      <circle cx="19" cy="24" r="7" />
      <ellipse cx="20" cy="35" rx="11.5" ry="8.5" />
      <circle cx="31" cy="38.5" r="2.6" />
    </>
  );

  return (
    <svg
      width={size}
      height={Math.round(size * 1.1)}
      viewBox="0 0 40 44"
      aria-hidden="true"
    >
      {variant === 'solid' ? (
        <g fill="var(--accent)" stroke="none">{shapes}</g>
      ) : (
        <g fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.35">{shapes}</g>
      )}
    </svg>
  );
}
