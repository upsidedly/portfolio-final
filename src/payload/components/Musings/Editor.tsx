"use client";

import { RenderFields, useFormFields, useFormSubmitted } from "@payloadcms/ui";
import type { CollapsibleFieldClientProps } from "payload";
import { useEffect, useRef } from "react";

export function PostSettings({
  field,
  indexPath = "",
  parentPath = "",
  parentSchemaPath = "",
  permissions,
  readOnly,
}: CollapsibleFieldClientProps) {
  const details = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);
  const submitted = useFormSubmitted();
  const hasErrors = useFormFields(([fields]) =>
    field.fields
      .flatMap((setting) =>
        setting.type === "row" ? setting.fields : [setting],
      )
      .some((setting) => {
        if (!("name" in setting)) return false;
        const path = parentPath
          ? `${parentPath}.${setting.name}`
          : setting.name;
        return fields[path]?.valid === false;
      }),
  );

  useEffect(() => {
    if (submitted && hasErrors && details.current) details.current.open = true;
  }, [hasErrors, submitted]);

  return (
    <details className="musing-settings" ref={details}>
      <summary ref={summary}>Post settings</summary>
      <RenderFields
        className="musing-settings-fields"
        fields={field.fields}
        forceRender
        margins="small"
        parentIndexPath={indexPath}
        parentPath={parentPath}
        parentSchemaPath={parentSchemaPath}
        permissions={permissions ?? {}}
        readOnly={readOnly}
      />
      <button
        className="musing-settings-close"
        onClick={() => {
          if (details.current) details.current.open = false;
          summary.current?.focus();
        }}
        type="button"
      >
        Hide post settings
      </button>
    </details>
  );
}
