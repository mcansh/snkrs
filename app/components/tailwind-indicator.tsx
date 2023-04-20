import clsx from "clsx";

export function TailwindIndicator({
  position = "bottom left",
}: {
  position?: "bottom left" | "bottom right" | "top left" | "top right";
}) {
  if (process.env.NODE_ENV === "production") return null;

  return (
    <div
      className={clsx(
        "fixed z-50 flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 p-3 font-mono text-xs text-white",
        {
          "left-1 top-1": position === "top left",
          "right-1 top-1": position === "top right",
          "bottom-1 left-1": position === "bottom left",
          "bottom-1 right-1": position === "bottom right",
        }
      )}
    >
      <div className="block sm:hidden">xs</div>
      <div className="hidden sm:block md:hidden">sm</div>
      <div className="hidden md:block lg:hidden">md</div>
      <div className="hidden lg:block xl:hidden">lg</div>
      <div className="hidden xl:block 2xl:hidden">xl</div>
      <div className="hidden 2xl:block">2xl</div>
    </div>
  );
}
