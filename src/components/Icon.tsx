import type { GlyphId, RecommendationIcon } from '../model/types';

/**
 * Единый набор line-иконок (stroke 1.5px), нарисованных вручную.
 * Тип сигнала кодируется формой глифа, а не цветом.
 */
export type IconId =
  | GlyphId
  | RecommendationIcon
  | 'calm'
  | 'activity'
  | 'alert'
  | 'plus'
  | 'close'
  | 'chevron'
  | 'reset';

/** Только контуры иконки — чтобы их можно было встраивать во вложенный <svg> карты. */
export function IconShape({ id }: { id: IconId }) {
  switch (id) {
    case 'carrot':
      return (
        <>
          <path d="M14.5 9.5 6.5 20.5l-3-3L14.5 9.5z" />
          <path d="M14.5 9.5l2-5M14.5 9.5l5-2" />
        </>
      );
    case 'hole':
      return (
        <>
          <path d="M3.5 12h17" />
          <path d="M6.5 12a5.5 4.5 0 0 0 11 0" />
          <path d="M9.5 12v3.5M12 12v4.5M14.5 12v3.5" />
        </>
      );
    case 'wave':
    case 'sensor':
      return (
        <>
          <circle cx="12" cy="14.5" r="1" />
          <path d="M8.5 11a5 5 0 0 1 7 0" />
          <path d="M6 7.5a9 9 0 0 1 12 0" />
        </>
      );
    case 'rustle':
      return <path d="M12 12a1.2 1.2 0 0 1-2.4 0 2.4 2.4 0 0 1 4.8 0 3.6 3.6 0 0 1-7.2 0 4.8 4.8 0 0 1 9.6 0" />;
    case 'paw':
      return (
        <>
          <ellipse cx="12" cy="15.5" rx="3.6" ry="3" />
          <circle cx="7" cy="10.5" r="1.7" />
          <circle cx="12" cy="8.5" r="1.7" />
          <circle cx="17" cy="10.5" r="1.7" />
        </>
      );
    case 'eye':
      return (
        <>
          <path d="M2.5 12S6.5 6 12 6s9.5 6 9.5 6-4 6-9.5 6S2.5 12 2.5 12z" />
          <circle cx="12" cy="12" r="2.5" />
        </>
      );
    case 'fence':
      return (
        <>
          <path d="M5.5 20V8l2-2.5L9.5 8v12" />
          <path d="M14.5 20V8l2-2.5L18.5 8v12" />
          <path d="M3 12.5h18M3 16.5h18" />
        </>
      );
    case 'storage':
      return (
        <>
          <path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5z" />
          <path d="M4 8.5l8 4.5 8-4.5M12 13v7" />
        </>
      );
    case 'chart':
      return <path d="M4.5 19.5V13M9.5 19.5V7M14.5 19.5v-9M19.5 19.5V4.5" />;
    case 'calm':
      return (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M8.5 12.5l2.5 2.5 4.5-5.5" />
        </>
      );
    case 'activity':
      return <path d="M3 12.5h4L9.5 6l5 12 2.5-5.5h4" />;
    case 'alert':
      return (
        <>
          <path d="M12 4 21 19.5H3z" />
          <path d="M12 10v4M12 16.6v.2" />
        </>
      );
    case 'plus':
      return <path d="M12 5.5v13M5.5 12h13" />;
    case 'close':
      return <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />;
    case 'chevron':
      return <path d="M6.5 9.5l5.5 5.5 5.5-5.5" />;
    case 'reset':
      return (
        <>
          <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
          <path d="M19.7 4.3v3.6h-3.6" />
        </>
      );
  }
}

interface IconProps {
  id: IconId;
  size?: number;
  className?: string;
}

export function Icon({ id, size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <IconShape id={id} />
    </svg>
  );
}
