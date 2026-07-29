"use client";

import { useMemo, useState } from "react";
import { registerPaymentAction } from "@/lib/actions/payment-actions";
import { Field } from "@/components/ui";

type ParentOption = {
  id: string;
  name: string;
  childIds: string[];
};

type ChildOption = {
  id: string;
  label: string;
  remaining: number;
};

export function PaymentForm({
  parents,
  childOptions,
  defaults,
}: {
  parents: ParentOption[];
  childOptions: ChildOption[];
  defaults: {
    childId?: string;
    year: number;
    month: number;
    paidAt: string;
    amount?: number;
  };
}) {
  const [payerUserId, setPayerUserId] = useState("");
  const [childId, setChildId] = useState(defaults.childId || childOptions[0]?.id || "");
  const [payerName, setPayerName] = useState("");

  const filteredChildren = useMemo(() => {
    if (!payerUserId) return childOptions;
    const parent = parents.find((p) => p.id === payerUserId);
    if (!parent) return childOptions;
    return childOptions.filter((c) => parent.childIds.includes(c.id));
  }, [payerUserId, parents, childOptions]);

  const selected = childOptions.find((c) => c.id === childId);
  const defaultAmount =
    defaults.amount ?? selected?.remaining ?? filteredChildren[0]?.remaining ?? 0;

  return (
    <form action={registerPaymentAction} className="panel form-stack max-w-xl">
      <h2 className="font-display text-lg">Zarejestruj wpłatę</h2>

      <Field label="Kto płaci (konto)" htmlFor="payerUserId">
        <select
          id="payerUserId"
          name="payerUserId"
          className="input"
          value={payerUserId}
          onChange={(e) => {
            const id = e.target.value;
            setPayerUserId(id);
            const parent = parents.find((p) => p.id === id);
            if (parent) {
              setPayerName(parent.name);
              const firstChild = childOptions.find((c) =>
                parent.childIds.includes(c.id),
              );
              if (firstChild) setChildId(firstChild.id);
            }
          }}
        >
          <option value="">— wpłata bez konta / gotówka —</option>
          {parents.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Imię i nazwisko płatnika" htmlFor="payerName">
        <input
          id="payerName"
          name="payerName"
          className="input"
          required
          value={payerName}
          onChange={(e) => setPayerName(e.target.value)}
          placeholder="Jan Kowalski"
        />
      </Field>

      <Field label="Za kogo (dziecko)" htmlFor="childId">
        <select
          id="childId"
          name="childId"
          className="input"
          required
          value={childId}
          onChange={(e) => setChildId(e.target.value)}
        >
          {filteredChildren.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label} — pozostało {c.remaining.toFixed(2)} zł
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Rok" htmlFor="year" inline={false}>
          <input
            id="year"
            name="year"
            type="number"
            className="input"
            required
            defaultValue={defaults.year}
          />
        </Field>
        <Field label="Miesiąc" htmlFor="month" inline={false}>
          <input
            id="month"
            name="month"
            type="number"
            min={1}
            max={12}
            className="input"
            required
            defaultValue={defaults.month}
          />
        </Field>
      </div>

      <Field label="Kwota (PLN)" htmlFor="amount">
        <input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          className="input"
          required
          key={`${childId}-${defaultAmount}`}
          defaultValue={defaultAmount > 0 ? defaultAmount.toFixed(2) : ""}
        />
      </Field>

      <Field label="Data wpłaty" htmlFor="paidAt">
        <input
          id="paidAt"
          name="paidAt"
          type="date"
          className="input"
          required
          defaultValue={defaults.paidAt}
        />
      </Field>

      <Field label="Metoda" htmlFor="method">
        <select id="method" name="method" className="input" defaultValue="TRANSFER">
          <option value="TRANSFER">Przelew</option>
          <option value="CASH">Gotówka</option>
        </select>
      </Field>

      <Field label="Tytuł / nr referencyjny" htmlFor="reference">
        <input
          id="reference"
          name="reference"
          className="input"
          placeholder="Obiad 2026-07 Jan Kowalski"
        />
      </Field>

      <Field label="Notatka" htmlFor="note">
        <input id="note" name="note" className="input" />
      </Field>

      <button type="submit" className="btn btn-primary">
        Zapisz i wystaw pokwitowanie
      </button>
    </form>
  );
}
