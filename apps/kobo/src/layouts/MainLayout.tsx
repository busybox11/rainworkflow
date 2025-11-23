import Clock from "../components/Clock";

export default function MainLayout({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <div className="main-layout">
      <header
        style={{
          padding: "1.5rem 2rem",
          borderBottom: "2px solid gray",
        }}
      >
        <span style={{ float: "left" }}>
          <img
            src="/widget.svg"
            alt="logo"
            style={{ height: "2rem" }}
            onClick={() => {
              // reload the page
              window.location.reload();
            }}
          />
        </span>

        <div style={{ float: "right" }}>
          <Clock />
        </div>
      </header>

      <main className="main-layout-content">{children}</main>
    </div>
  );
}
