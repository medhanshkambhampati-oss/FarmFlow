import React, { useState } from "react";
import bgvideo from '../../public/Video_Edit_Slow_Plant_Growth.mp4'
import Navbar from "../components/Navbar";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import TextType from "../components/rb/TextType";

const Home = ({sl,sr,fsl,fsr,setSl,setSr}) => {

  return (
    <div className="relative h-screen w-full overflow-hidden">
      
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover -z-10"
      >
        <source src={bgvideo} type="video/mp4" />
      </video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40 -z-10"></div>

      <Navbar fsl={fsl} fsr={fsr} />
      
      {sl && <LoginPage setSl={setSl} />}
      {sr && <RegisterPage setSr={setSr} />}

      {!sl && !sr && (
        <TextType
          text={[
            "Smart Crop Prediction for Better Farming",
            "Predict Yield in kg per Hectare with AI",
            "Analyze Post-Harvest NPK for Healthy Soil",
            "Accurate Yield Prediction (kg/hectare)", 
            "Soil Intelligence with Post-Harvest NPK Analysis"
          ]}
          typingSpeed={75}
          pauseDuration={1500}
          deletingSpeed={50}
          variableSpeed={{ min: 30, max: 100 }}
          showCursor
          cursorCharacter="_"
          cursorBlinkDuration={0.5}

          className="p-25 text-white text-5xl font-bold"
        />
      )}


    </div>
  );
};

export default Home;