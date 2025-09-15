import { Toaster } from "react-hot-toast"
import App from "../src/App"

export default function Page() {
  return (
    <>
      <App />
      <Toaster position="top-right" />
    </>
  )
}
