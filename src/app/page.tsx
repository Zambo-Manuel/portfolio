import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to the static portfolio index in `public/portfolio`
  redirect("/portfolio/index.html");
}
