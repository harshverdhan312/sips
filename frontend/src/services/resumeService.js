export const resumeService = {
  // Simulates end-to-end multi-step AI resume parsing
  async analyzeResumeFile(file) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          fileName: file ? file.name : "Khushi_Sharma_Software_Engineer_Resume.pdf",
          fileSize: file ? (file.size / (1024 * 1024)).toFixed(2) + " MB" : "1.2 MB",
          uploadDate: new Date().toLocaleDateString(),
          overallScore: 88,
          atsCompatibility: "94% (ATS Safe)",
          sectionsScore: {
            contactInfo: 100,
            summary: 90,
            skills: 92,
            projects: 86,
            education: 95,
            formatting: 90
          },
          detectedSkills: [
            { name: "React.js", category: "Frontend", level: "Advanced" },
            { name: "Python", category: "Backend / Scripting", level: "Advanced" },
            { name: "JavaScript (ES6+)", category: "Programming", level: "Advanced" },
            { name: "SQL (PostgreSQL)", category: "Database", level: "Intermediate" },
            { name: "Tailwind CSS", category: "Frontend", level: "Advanced" },
            { name: "Git & GitHub", category: "DevOps", level: "Advanced" },
            { name: "FastAPI", category: "Backend", level: "Intermediate" },
            { name: "Redis", category: "Cache / Database", level: "Intermediate" }
          ],
          missingTargetSkills: [
            { name: "Docker", reason: "Present in 82% of SDE Tier-1 job descriptions", priority: "High" },
            { name: "AWS Cloud (S3/EC2)", reason: "Mentioned in Microsoft, Amazon, Google campus JDs", priority: "High" },
            { name: "System Design / Scalability", reason: "Differentiator for packages above 20 LPA", priority: "Medium" },
            { name: "CI/CD (GitHub Actions)", reason: "Improves automated deployment profile", priority: "Low" }
          ],
          strengths: [
            "Quantifiable achievements used throughout projects (e.g. 'Reduced latency by 35%')",
            "Clean single-column ATS-friendly hierarchy with clear header tags",
            "Strong balance between frontend, backend, and machine learning projects",
            "Contact information is prominent and includes active GitHub and LeetCode links"
          ],
          recommendations: [
            "Add a dedicated 'Cloud & DevOps' skill section highlighting Docker, Linux, and AWS",
            "Convert passive voice verbs to strong action verbs (e.g., replace 'Worked on' with 'Architected')",
            "Highlight test coverage (e.g. 'Wrote comprehensive Jest unit tests achieving 85% coverage')",
            "Ensure bullet points strictly adhere to Google's X-Y-Z formula: Accomplished [X], measured by [Y], by doing [Z]"
          ],
          jobMatches: [
            { company: "Google", role: "Software Engineer", matchScore: 92, status: "High Fit" },
            { company: "Amazon", role: "Frontend SDE", matchScore: 95, status: "Exceptional Fit" },
            { company: "Microsoft", role: "SDE-1 Azure", matchScore: 86, status: "Good Fit" },
            { company: "Morgan Stanley", role: "Technology Analyst", matchScore: 84, status: "Good Fit" }
          ]
        });
      }, 1800);
    });
  }
};
