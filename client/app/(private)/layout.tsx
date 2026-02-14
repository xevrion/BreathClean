import AppNavbar from "@/components/saved-routes/AppNavbar";

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppNavbar />
      {children}
    </>
  );
}
