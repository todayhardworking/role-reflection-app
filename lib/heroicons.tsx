import type { ReactNode, SVGProps } from "react";

function IconBase({ children, ...props }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function Bars3Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </IconBase>
  );
}

export function XMarkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </IconBase>
  );
}

export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M3.75 9.75 12 3l8.25 6.75V20a1 1 0 0 1-1 1H15v-6H9v6H4.75a1 1 0 0 1-1-1z" />
    </IconBase>
  );
}

export function PencilSquareIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M9.75 3.75h-3a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-3" />
      <path d="m13.5 5.25 1.8-1.8a1.5 1.5 0 0 1 2.12 0l2.12 2.12a1.5 1.5 0 0 1 0 2.12l-1.8 1.8-4.44-4.44Z" />
      <path d="M12.75 6l4.5 4.5" />
    </IconBase>
  );
}

export function BookOpenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M12 6.75V18" />
      <path d="M12 18.75c-2.25-1.5-4.5-1.5-6.75 0V6.75c2.25-1.5 4.5-1.5 6.75 0 2.25-1.5 4.5-1.5 6.75 0v12c-2.25-1.5-4.5-1.5-6.75 0Z" />
    </IconBase>
  );
}

export function ArrowRightOnRectangleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M15.75 7.5 21 12l-5.25 4.5" />
      <path d="M21 12H9" />
      <path d="M12.75 6.75V6a3 3 0 0 0-3-3h-4.5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h4.5a3 3 0 0 0 3-3v-.75" />
    </IconBase>
  );
}
