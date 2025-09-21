import React from "react";
import Card from "@/components/ui/Card";

import "./PageContainer.css";

function PageContainer({ error, fluid, children }) {
  return (
    <div className={`page-container ${fluid ? "fluid" : ""}`}>
      {!error ? (
        children
      ) : (
        <Card>
          <div className="page-error-container">
            <img src="/assets/images/error.png" alt="error image" />
            <h3>Can't fetch the data, please try again later.</h3>
          </div>
        </Card>
      )}
    </div>
  );
}

export default PageContainer;
