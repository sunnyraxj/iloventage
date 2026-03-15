import type { SVGProps } from "react";

// This file can be used for custom SVG icons.
// For now, we are using lucide-react for most icons.
export function Placeholder(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
           <circle cx="12" cy="12" r="10" />
        </svg>
    );
}

export function NitecLogo(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <path
                d="M11.23 3.48H4.2V20.52H11.23V13.8L19.8 20.52V3.48L11.23 10.2V3.48Z"
                fill="currentColor"
            />
        </svg>
    );
}
