"use client";

import { useId, type ComponentProps, type CSSProperties } from "react";
import { BaseEdge } from "@xyflow/react";
import { ELEMENT_CONNECTION_CONFIG as config } from "./element-connection-config";
import styles from "./element-connection-path.module.css";

/** Motion follows the source-to-target path; the end marker remains visible. */
export function ElementConnectionPath({
  color,
  ...props
}: Readonly<
  Omit<ComponentProps<typeof BaseEdge>, "markerEnd"> & { color: string }
>) {
  const markerId = useId();
  return (
    <>
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX={9}
          refY={5}
          markerWidth={config.endArrowSize}
          markerHeight={config.endArrowSize}
          orient="auto"
        >
          <path
            d="M 1 1 L 9 5 L 1 9"
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>
      <BaseEdge
        {...props}
        markerEnd={`url(#${markerId})`}
        style={{
          strokeWidth: config.lineWidth,
          opacity: config.lineOpacity,
          ...props.style,
          stroke: color,
        }}
      />
      {Array.from({ length: config.arrowCount }, (_, index) => (
        <path
          key={index}
          aria-hidden="true"
          className={styles.flow}
          style={
            {
              offsetPath: `path("${props.path}")`,
              "--flow-duration": `${config.durationSeconds}s`,
              "--flow-reduced-duration": `${config.reducedMotionDurationSeconds}s`,
              "--flow-delay-ratio": -index / config.arrowCount,
              "--flow-opacity": config.arrowOpacity,
            } as CSSProperties
          }
          d={`M ${-config.arrowSize / 2} ${-config.arrowSize * 0.375} L 0 0 L ${-config.arrowSize / 2} ${config.arrowSize * 0.375}`}
          fill="none"
          stroke={color}
          strokeWidth={config.arrowStrokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </>
  );
}
