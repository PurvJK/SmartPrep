import { Client } from "@gradio/client";
import fs from "fs"; // ✅ Import fs so we can read local files

export default async function runExamples() {
  // Connect to Hugging Face Space
  const client = await Client.connect("girishwangikar/ResumeATS");
  console.log("✅ Connected to ResumeATS Space");

  // 1. Update Job Description Visibility
  const visibility = await client.predict("/update_job_description_visibility", {
    with_job_description: true,
  });
  console.log("Update Job Description Visibility:", visibility.data);


  // 2. Process Resume (upload your own local file)
  // skip PDF just for testing
const resumeText = `
Purv Kapuriya  
Backend Developer | Node.js | MongoDB  

- Built RESTful APIs with Node.js and Express  
- Designed MongoDB schemas for scalable applications  
- Experience with JWT authentication and Docker  
`;

// analyze
const analyzedResume = await client.predict("/analyze_resume", {
  resume_text: resumeText,
  job_description: "Looking for a backend developer skilled in Node.js & MongoDB",
  with_job_description: true,
  temperature: 0.7,
  max_tokens: 300,
});
console.log("Analyzed Resume:", analyzedResume.data);
  // ✅ Fix: ensure text is extracted correctly


  // 4. Generate Cover Letter
  const coverLetter = await client.predict("/generate_cover_letter", {
    resume_text: resumeText,
    job_description: "Looking for a backend developer skilled in Node.js & MongoDB",
    temperature: 0.7,
    max_tokens: 400,
  });
  console.log("Generated Cover Letter:", coverLetter.data);
} // <-- ✅ closing brace for function





