"use client";

import { DefaultCell, useListQuery } from "@payloadcms/ui";
import type { DefaultCellComponentProps } from "payload";

const statuses = [
  { label: "All", value: undefined },
  { label: "Drafts", value: "draft" },
  { label: "Published", value: "published" },
] as const;

export function MusingFilters() {
  const { query, refineListData } = useListQuery();
  const { _status, ...otherFilters } = query.where ?? {};
  const activeStatus =
    _status && "equals" in _status ? _status.equals : undefined;

  return (
    <div
      aria-label="Filter musings by status"
      className="musing-filters"
      role="group"
    >
      {statuses.map(({ label, value }) => (
        <button
          aria-pressed={activeStatus === value}
          key={label}
          onClick={() =>
            void refineListData({
              where: value
                ? { ...otherFilters, _status: { equals: value } }
                : otherFilters,
            })
          }
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function MusingTitleCell(props: DefaultCellComponentProps) {
  const title = typeof props.cellData === "string" ? props.cellData.trim() : "";
  return <DefaultCell {...props} cellData={title || "Untitled"} />;
}
