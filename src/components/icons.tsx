import type { SVGProps } from "react";

export function NextBazaarLogo(props: SVGProps<SVGSVGElement>) {
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
            <path d="M6 9l6 6 6-6" />
            <path d="M6 15l6-6 6 6" />
        </svg>
    );
}
