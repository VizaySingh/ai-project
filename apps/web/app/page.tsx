import { OwnerConsole } from "@/components/owner-console";
import { WidgetPreview } from "@/components/widget-preview";

export default function HomePage() {
  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <OwnerConsole />
        <WidgetPreview />
      </section>
    </main>
  );
}
