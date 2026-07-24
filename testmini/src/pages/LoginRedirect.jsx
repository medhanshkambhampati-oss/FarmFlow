import { useEffect } from "react";
import Home from "./Home.jsx";

export default function LoginRedirect({ fsl, sl, sr, fsr,setSr,setSl }) {

  useEffect(() => {
    fsl();
  }, [fsl]);

  return <Home sl={sl} sr={sr} fsl={fsl} fsr={fsr} setSr={setSr} setSl={setSl} />;
}