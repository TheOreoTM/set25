import { Suspense } from "react";
import { ChevronDown } from "lucide-react";
import { formatMVR } from "@set25/shared";
import { PageHeader } from "@/components/page-header";
import {
  DeliveryOptionForm,
  StoreSettingsForm,
} from "@/components/store/store-settings-forms";
import { requireOperationalPageAccess } from "@/lib/auth/session";
import { getStoreSettingsForHq } from "@/lib/store/data";
import {
  createDeliveryOptionAction,
  updateDeliveryOptionAction,
  updateStoreSettingsAction,
} from "@/lib/store/actions";

export const metadata = { title: "Store settings" };

export default function StoreSettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Launch / Store"
        title="Store settings"
        description="Online ordering, customer contact, and delivery pricing for the public SET25 Store."
      />
      <Suspense fallback={<div className="skeleton skeleton--detail" />}>
        <StoreSettingsContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function StoreSettingsContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [, query, { settings, deliveryOptions }] = await Promise.all([
    requireOperationalPageAccess("/?forbidden=staff-role"),
    searchParams,
    getStoreSettingsForHq(),
  ]);
  const activeOptions = deliveryOptions.filter((option) => option.active);
  return (
    <>
      {query.saved ? (
        <div className="form-message form-message--success" role="status">
          {query.saved === "delivery"
            ? "Delivery option saved."
            : "Store settings saved."}
        </div>
      ) : null}
      <section
        className="supply-summary-strip supply-summary-strip--two"
        aria-label="Store status"
      >
        <div>
          <span>Online ordering</span>
          <strong
            className={`status status--${settings?.storeOpen ? "completed" : "cancelled"}`}
          >
            {settings?.storeOpen ? "Open" : "Closed"}
          </strong>
        </div>
        <div>
          <span>Delivery options offered</span>
          <strong>{activeOptions.length}</strong>
        </div>
      </section>
      {settings?.storeOpen && !activeOptions.length ? (
        <div className="form-message form-message--error" role="alert">
          Checkout needs at least one active delivery option.
        </div>
      ) : null}
      <StoreSettingsForm
        action={updateStoreSettingsAction}
        defaults={{
          storeOpen: settings?.storeOpen ?? false,
          announcement: settings?.announcement ?? "",
          reservationHours: settings?.reservationHours ?? 24,
          supportPhone: settings?.supportPhone ?? "",
          supportWhatsApp: settings?.supportWhatsApp ?? "",
          instagramHandle: settings?.instagramHandle ?? "",
          bankTransferInstructions: settings?.bankTransferInstructions ?? "",
          deliveryInstructions: settings?.deliveryInstructions ?? "",
        }}
      />
      <section
        className="resource-panel detail-section delivery-panel"
        aria-labelledby="delivery-title"
      >
        <div className="resource-panel-head">
          <div>
            <p className="kicker">Delivery</p>
            <h2 id="delivery-title">Delivery options</h2>
          </div>
          <p>Orders snapshot the method and fee at checkout</p>
        </div>
        {deliveryOptions.length ? (
          <div className="movement-list">
            {deliveryOptions.map((option) => (
              <details className="movement-row delivery-option" key={option.id}>
                <summary>
                  <span>
                    <strong>{option.name}</strong>
                    <small>
                      {option.active ? "Offered" : "Not offered"} ·{" "}
                      {option._count.deliveries} orders
                      {option.description ? ` · ${option.description}` : ""}
                    </small>
                  </span>
                  <strong>{formatMVR(option.price)}</strong>
                  <span className="delivery-option-toggle" aria-hidden="true">
                    Edit <ChevronDown />
                  </span>
                </summary>
                <DeliveryOptionForm
                  action={updateDeliveryOptionAction.bind(null, option.id)}
                  submitLabel="Save option"
                  defaults={{
                    name: option.name,
                    description: option.description ?? "",
                    price: option.price.toString(),
                    sortOrder: option.sortOrder,
                    active: option.active,
                  }}
                />
              </details>
            ))}
          </div>
        ) : (
          <div className="inline-empty inline-empty--compact">
            <p>No delivery options yet.</p>
            <span>Add the first option below so checkout can open.</span>
          </div>
        )}
        <div className="delivery-option-create">
          <p className="kicker">Add delivery option</p>
          <DeliveryOptionForm
            action={createDeliveryOptionAction}
            submitLabel="Add option"
          />
        </div>
      </section>
    </>
  );
}
