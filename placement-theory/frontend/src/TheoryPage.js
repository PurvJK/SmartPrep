import { useEffect, useState } from "react";
function TheoryPage() {
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/theory")
      .then(res => res.json())
      .then(data => setTopics(data));
  }, []);

  return (
    <div>
      {topics.map(topic => (
        <div key={topic._id} style={{ marginBottom: "30px" }}>
          <h2>{topic.subject} - {topic.title}</h2>
          {topic.blocks.map((block, i) =>
            block.type === "text" ? (
              <p key={i}>{block.content}</p>
            ) : (
              <img key={i} src={block.imageUrl} alt="theory" style={{ maxWidth: "400px", margin: "10px 0" }} />
            )
          )}
        </div>
      ))}
    </div>
  );
}

export default TheoryPage;
