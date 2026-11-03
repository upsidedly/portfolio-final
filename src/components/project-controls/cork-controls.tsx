"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  codeReply,
  createdReply,
  overview,
  settingsReply,
  type ProjectAction,
  type ProjectOverview,
  type PurchaseSettings,
} from "~/lib/project-controls/contracts";
import styles from "./project-controls.module.css";

async function request(
  action?: ProjectAction,
  signal?: AbortSignal,
): Promise<unknown> {
  const response = await fetch("/api/project-controls", {
    method: action ? "POST" : "GET",
    cache: "no-store",
    signal,
    ...(action
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action),
        }
      : {}),
  });
  if (response.status === 401)
    throw new Error("Your owner session ended. Sign in again from Tools.");
  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new Error("The response could not be read. Retry the same action.");
  }
  if (!response.ok)
    throw new Error(
      result &&
        typeof result === "object" &&
        "error" in result &&
        typeof result.error === "string"
        ? result.error
        : "This action could not be completed.",
    );
  return result;
}
const errorText = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "This action could not be completed.";
const date = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

export function CorkControls() {
  const [data, setData] = useState<ProjectOverview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [code, setCode] = useState<{ code: string; label: string } | null>(
    null,
  );
  const codeField = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const loadGeneration = useRef(0);
  const load = useCallback(async (signal?: AbortSignal) => {
    const ticket = ++loadGeneration.current;
    const next = overview.parse(await request(undefined, signal));
    if (ticket === loadGeneration.current) setData(next);
    return next;
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal).catch((error) => {
      if (!controller.signal.aborted) setError(errorText(error));
    });
    return () => controller.abort();
  }, [load]);
  useEffect(() => {
    if (code) {
      codeField.current?.focus();
      codeField.current?.select();
    }
  }, [code]);

  async function act(action: ProjectAction, label: string) {
    if (busy) return;
    setBusy(label);
    setError("");
    setNotice("");
    try {
      const result = await request(action);
      if (action.action === "reveal-gift") {
        const next = codeReply.parse(result);
        setCode({
          ...next,
          label:
            data?.gifts.find((gift) => gift.id === action.id)?.label ??
            "Gift code",
        });
      } else {
        if (action.action === "set-gift-status") {
          setData((current) =>
            current
              ? {
                  ...current,
                  gifts: current.gifts.map((gift) =>
                    gift.id === action.id
                      ? { ...gift, disabled: action.disabled }
                      : gift,
                  ),
                }
              : current,
          );
          setNotice(
            action.disabled
              ? "Gift code disabled. Existing activations keep their rights."
              : "Gift code enabled.",
          );
        }
        try {
          await load();
        } catch {
          setError(
            "Saved, but the list couldn’t refresh. Refresh it to see the latest state.",
          );
        }
      }
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(null);
    }
  }
  async function copy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code.code);
      setNotice("Gift code copied.");
    } catch {
      codeField.current?.focus();
      codeField.current?.select();
      setNotice("Select and copy the gift code above.");
    }
  }
  const matches =
    data?.gifts.filter((gift) =>
      `${gift.label} ${gift.suffix}`
        .toLowerCase()
        .includes(search.toLowerCase().trim()),
    ) ?? [];
  return (
    <main id="main" className={styles.controls}>
      <div className="tool-heading">
        <Link href="/tools/projects" className="back-link">
          ← Project controls
        </Link>
        <div className={styles.title}>
          <h1>Cork</h1>
          <a href="https://cork.upsided.dev" target="_blank" rel="noreferrer">
            Open site ↗
          </a>
        </div>
      </div>
      {error && (
        <p role="alert" className="tool-error">
          {error}
        </p>
      )}
      {!data ? (
        <button
          className="primary-button"
          disabled={!error || Boolean(busy)}
          onClick={() => {
            setError("");
            void load().catch((e) => setError(errorText(e)));
          }}
        >
          {error ? "Try again" : "Loading project…"}
        </button>
      ) : (
        <>
          <section aria-labelledby="gift-title" className={styles.section}>
            <div className={styles.sectionTitle}>
              <h2 id="gift-title">Gift codes</h2>
              <button
                className="text-button"
                disabled={Boolean(busy)}
                onClick={() => {
                  setBusy("refresh");
                  setError("");
                  void load()
                    .catch((e) => setError(errorText(e)))
                    .finally(() => setBusy(null));
                }}
              >
                Refresh
              </button>
            </div>
            {!data.service.giftsReady && (
              <p className="tool-error">
                The gift service needs configuration before you can create
                codes.
              </p>
            )}
            <GiftForm
              disabled={!data.service.giftsReady || Boolean(busy)}
              onCreated={async (next) => {
                setCode(next);
                setNotice("Gift code created.");
                try {
                  await load();
                } catch {
                  setError(
                    "The code was created, but the list couldn’t refresh.",
                  );
                }
              }}
            />
            {code && (
              <section
                className={styles.codePanel}
                aria-label="Gift code ready"
              >
                <h3>{code.label}</h3>
                <input
                  ref={codeField}
                  aria-label="Gift code"
                  value={code.code}
                  readOnly
                  autoComplete="off"
                  spellCheck={false}
                />
                <div className={styles.actions}>
                  <button
                    className="primary-button"
                    onClick={() => void copy()}
                  >
                    Copy code
                  </button>
                  <button className="text-button" onClick={() => setCode(null)}>
                    Done
                  </button>
                </div>
              </section>
            )}
            <div className={styles.search}>
              <label htmlFor="gift-search">Search recent codes</label>
              <input
                id="gift-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name or code ending"
              />
            </div>
            {data.gifts.length === 0 ? (
              <p className={styles.empty}>No gift codes yet.</p>
            ) : matches.length === 0 ? (
              <p className={styles.empty}>No matching codes.</p>
            ) : (
              <ul className={styles.giftList}>
                {matches.map((gift) => {
                  const state = gift.disabled
                    ? "Disabled"
                    : gift.uses >= gift.maxUses
                      ? "Used"
                      : gift.redeemBy && Date.parse(gift.redeemBy) <= Date.now()
                        ? "Deadline passed"
                        : "Available";
                  return (
                    <li key={gift.id}>
                      <div className={styles.giftHeading}>
                        <h3>{gift.label}</h3>
                        <span>{state}</span>
                      </div>
                      <p>
                        {gift.accessDays === null
                          ? "Permanent access"
                          : `${gift.accessDays} days after redemption`}{" "}
                        · {gift.uses} / {gift.maxUses} redeemed
                      </p>
                      <p className="quiet">
                        Ends …{gift.suffix}
                        {gift.redeemBy
                          ? ` · Redeem by ${date(gift.redeemBy)}`
                          : " · No redemption deadline"}
                      </p>
                      {gift.message && (
                        <details className={styles.message}>
                          <summary>Gift message</summary>
                          <p>{gift.message}</p>
                        </details>
                      )}
                      <div className={styles.actions}>
                        <button
                          className="text-button"
                          disabled={Boolean(busy)}
                          onClick={() =>
                            void act(
                              { action: "reveal-gift", id: gift.id },
                              gift.id,
                            )
                          }
                        >
                          Show code
                        </button>
                        <button
                          className="text-button"
                          disabled={Boolean(busy)}
                          onClick={() =>
                            void act(
                              {
                                action: "set-gift-status",
                                id: gift.id,
                                disabled: !gift.disabled,
                              },
                              gift.id,
                            )
                          }
                        >
                          {busy === gift.id
                            ? "Working…"
                            : gift.disabled
                              ? "Enable code"
                              : "Disable code"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {data.gifts.length === 200 && (
              <p className="quiet">Showing the latest 200 gift codes.</p>
            )}
          </section>
          <PurchaseForm
            data={data}
            onSaved={async () => {
              await load();
            }}
          />
          {data.history.length > 0 && (
            <details className={styles.activity}>
              <summary>Recent activity</summary>
              <ul>
                {data.history.map((entry, index) => (
                  <li key={`${entry.createdAt}-${index}`}>
                    <span>{entry.action.replaceAll("-", " ")}</span>
                    <span className="quiet">
                      {date(entry.createdAt)} · {entry.actor}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
      <p role="status" aria-live="polite" className={styles.notice}>
        {notice}
      </p>
    </main>
  );
}

function GiftForm({
  disabled,
  onCreated,
}: {
  disabled: boolean;
  onCreated: (code: { code: string; label: string }) => Promise<void>;
}) {
  const [label, setLabel] = useState("");
  const [message, setMessage] = useState("");
  const [temporary, setTemporary] = useState(false);
  const [days, setDays] = useState("7");
  const [redeemBy, setRedeemBy] = useState("");
  const [maxUses, setMaxUses] = useState("1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef<{ fingerprint: string; id: string } | null>(null);
  const details = useRef<HTMLDetailsElement>(null);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || disabled) return;
    setBusy(true);
    setError("");
    try {
      const gift = {
        label: label.trim(),
        message,
        redeemBy: redeemBy ? new Date(redeemBy).toISOString() : null,
        accessDays: temporary ? Number(days) : null,
        maxUses: Number(maxUses),
      };
      const fingerprint = JSON.stringify(gift);
      const pendingRequest =
        pending.current?.fingerprint === fingerprint
          ? pending.current
          : { fingerprint, id: crypto.randomUUID() };
      pending.current = pendingRequest;
      const result = createdReply.parse(
        await request({
          action: "create-gift",
          gift,
          requestID: pendingRequest.id,
        }),
      );
      await onCreated({ code: result.code, label: result.label });
      pending.current = null;
      setLabel("");
      setMessage("");
      setRedeemBy("");
      if (details.current) details.current.open = false;
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <details ref={details} className={styles.create}>
      <summary>Create a gift code</summary>
      <form onSubmit={(event) => void submit(event)} className={styles.form}>
        <fieldset disabled={disabled || busy}>
          <label>
            Gift name
            <input
              required
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              maxLength={120}
              placeholder="A birthday gift"
            />
          </label>
          <label>
            Message after redemption <span className="quiet">(optional)</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="Something just for them."
            />
          </label>
          <span className="quiet">{message.length} / 1,000</span>
          <div className={styles.grid}>
            <label>
              Access
              <select
                value={temporary ? "temporary" : "forever"}
                onChange={(event) =>
                  setTemporary(event.target.value === "temporary")
                }
              >
                <option value="forever">Forever</option>
                <option value="temporary">For a number of days</option>
              </select>
            </label>
            {temporary && (
              <label>
                Days after redemption
                <input
                  type="number"
                  required
                  min={1}
                  max={3650}
                  value={days}
                  onChange={(event) => setDays(event.target.value)}
                />
              </label>
            )}
            <label>
              Redemptions
              <input
                type="number"
                required
                min={1}
                max={10000}
                value={maxUses}
                onChange={(event) => setMaxUses(event.target.value)}
              />
            </label>
            <label>
              Redeem by <span className="quiet">(optional)</span>
              <input
                type="datetime-local"
                value={redeemBy}
                onChange={(event) => setRedeemBy(event.target.value)}
              />
            </label>
          </div>
          <p className="quiet">
            A redemption deadline limits when the code can be claimed. Access
            length starts when it is claimed.
          </p>
          <button className="primary-button" type="submit">
            {busy ? "Creating…" : "Create gift code"}
          </button>
        </fieldset>
        {error && (
          <p role="alert" className="tool-error">
            {error}
          </p>
        )}
      </form>
    </details>
  );
}

function PurchaseForm({
  data,
  onSaved,
}: {
  data: ProjectOverview;
  onSaved: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<PurchaseSettings>(data.settings);
  const [version, setVersion] = useState(data.version);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = settingsReply.parse(
        await request({ action: "save-settings", settings: draft, version }),
      );
      setVersion(result.version);
      setNotice("Purchase settings saved.");
      try {
        await onSaved();
      } catch {
        setError(
          "Saved, but the page couldn’t refresh. Your settings are preserved.",
        );
      }
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className={styles.section} aria-labelledby="purchase-title">
      <details>
        <summary className={styles.purchaseSummary}>
          <h2 id="purchase-title">Purchase settings</h2>
        </summary>
        <p className="tool-description">
          Use a one-time Lemon Squeezy product with a permanent licence. Set its
          price in Lemon Squeezy.
        </p>
        <form onSubmit={(event) => void save(event)} className={styles.form}>
          <fieldset disabled={busy}>
            <div className={styles.grid}>
              <label>
                Store ID
                <input
                  inputMode="numeric"
                  value={draft.storeID}
                  onChange={(event) =>
                    setDraft({ ...draft, storeID: event.target.value })
                  }
                />
              </label>
              <label>
                Product ID
                <input
                  inputMode="numeric"
                  value={draft.productID}
                  onChange={(event) =>
                    setDraft({ ...draft, productID: event.target.value })
                  }
                />
              </label>
            </div>
            <label>
              Checkout link
              <input
                type="url"
                value={draft.purchaseURL}
                onChange={(event) =>
                  setDraft({ ...draft, purchaseURL: event.target.value })
                }
                placeholder="https://your-store.lemonsqueezy.com/checkout/buy/…"
              />
            </label>
            <button className="primary-button" type="submit">
              {busy ? "Saving…" : "Save purchase settings"}
            </button>
            {(data.version ?? 0) > (version ?? 0) && (
              <button
                className="text-button"
                type="button"
                onClick={() => {
                  setDraft(data.settings);
                  setVersion(data.version);
                  setError("");
                }}
              >
                Reload current settings
              </button>
            )}
          </fieldset>
          {error && (
            <p role="alert" className="tool-error">
              {error}
            </p>
          )}
          <p role="status" className="quiet">
            {notice}
          </p>
        </form>
      </details>
    </section>
  );
}
