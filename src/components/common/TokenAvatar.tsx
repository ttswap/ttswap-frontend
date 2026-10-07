import { useEffect, useMemo, useRef } from "react";
import { type TokenAvatarProps, GRK_SIZES } from "@/types/common";

const svgCache = new Map();

export const TokenAvatar: React.FC<TokenAvatarProps> = ({
    token_url,
    sub_url,
    size,
    is_chain_logo = false,
    chain_color,
    showPulse = false
}) => {
    const ref = useRef<HTMLDivElement>(null);

    const SIZE_CLASS = useMemo<string>(() => {
        switch (size) {
            case GRK_SIZES.EXTRA_EXTRA_SMALL:
                return "w-6 h-6";
            case GRK_SIZES.EXTRA_SMALL:
                return "w-8 h-8";
            case GRK_SIZES.SMALL:
                return "w-10 h-10";
            case GRK_SIZES.MEDIUM:
                return "w-12 h-12";
            case GRK_SIZES.LARGE:
                return "w-14 h-14";
            default:
                return "w-4 h-4";
        }
    }, [size]);

    const SUB_SIZE = useMemo<string>(() => {
        switch (size) {
            case GRK_SIZES.EXTRA_EXTRA_SMALL:
                return "w-3 h-3";
            case GRK_SIZES.EXTRA_SMALL:
                return "w-6 h-6";
            case GRK_SIZES.SMALL:
                return "w-8 h-8";
            case GRK_SIZES.MEDIUM:
                return "w-10 h-10";
            case GRK_SIZES.LARGE:
                return "w-12 h-12";
            default:
                return "w-8 h-8";
        }
    }, [size]);

    useEffect(() => {
        if (is_chain_logo) {
            (async () => {
                let data;
                if (svgCache.has(token_url)) {
                    data = svgCache.get(token_url);
                } else {
                    const response = await fetch(
                        token_url ||
                        "/token.svg"
                    );
                    data = await response.text();
                    svgCache.set(token_url, data);
                }

                const parser = new DOMParser();
                const svg = parser.parseFromString(
                    data,
                    "image/svg+xml"
                ).documentElement;

                const paths = svg.querySelectorAll("path");
                const fillColor = document.documentElement.classList.contains(
                    "dark"
                )
                    ? "white"
                    : "black";
                paths.forEach((path) => {
                    path.style.fill = fillColor;
                });

                const [width, height] = SIZE_CLASS.split(" ");
                svg.setAttribute("width", width);
                svg.setAttribute("height", height);

                if (ref.current) {
                    ref.current.innerHTML = svg.outerHTML;
                }
            })();
        }
    }, [token_url, SIZE_CLASS]);

    return is_chain_logo ? (
        <div ref={ref} className={SIZE_CLASS} />
    ) : (
        <>
            <img
                src={token_url || "/token.svg"}
                alt="Token Image"
                style={{ background: "#fff" }}
                className={`h-full w-full rounded-[100%]`}
                onError={(e) => {
                    if (e.currentTarget.getAttribute("src") !== "/token.svg") e.currentTarget.src = "/token.svg";
                }}
            />
            {sub_url && (
                <img
                    src={sub_url}
                    alt="Token Image"
                    style={{
                        background: chain_color ? chain_color : "grey",
                        padding: "1px",
                    }}
                    className={`${SUB_SIZE} absolute -bottom-2 -left-3 rounded-[100%]`}
                    onError={(e) => {
                        if (e.currentTarget.getAttribute("src") !== "/token.svg") e.currentTarget.src = "/token.svg";
                    }}
                />
            )}
        </>
    );
};
