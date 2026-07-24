import { useEffect } from "react";
import Home from "./Home.jsx";

export default function RegisterRedirect({ fsr, sl, sr, fsl, setSr, setSl }) {

  useEffect(() => {
    fsr();
  }, [fsr]);

  return (
    <Home
      sl={sl}
      sr={sr}
      fsl={fsl}
      fsr={fsr}
      setSr={setSr}
      setSl={setSl}
    />
  );
}