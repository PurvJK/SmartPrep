import React from "react";
import TheoryPage from "./TheoryPage";
import UploadForm from "./UploadForm";

function App() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>📘 Placement Preparation - Theory Section</h1>
      <UploadForm />
      <hr />
      <TheoryPage />
    </div>
  );
}

export default App;
