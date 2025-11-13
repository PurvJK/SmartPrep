import { useState } from "react";

function UploadForm() {
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState([]);

  const addTextBlock = () => setBlocks([...blocks, { type: "text", content: "" }]);
  const addImageBlock = () => setBlocks([...blocks, { type: "image", imageUrl: "" }]);

  const handleTextChange = (index, value) => {
    const newBlocks = [...blocks];
    newBlocks[index].content = value;
    setBlocks(newBlocks);
  };

  const handleImageUpload = async (index, file) => {
    const formData = new FormData();
    formData.append("images", file);

    const res = await fetch("http://localhost:5000/api/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    const newBlocks = [...blocks];
    newBlocks[index].imageUrl = data.urls[0]; // first image
    setBlocks(newBlocks);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch("http://localhost:5000/api/theory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, title, blocks }),
    });
    alert("Theory added!");
    setBlocks([]);
    setSubject("");
    setTitle("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} /><br/>
      <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} /><br/>
      {blocks.map((block, i) =>
        block.type === "text" ? (
          <textarea
            key={i}
            placeholder="Text block"
            value={block.content}
            onChange={e => handleTextChange(i, e.target.value)}
          />
        ) : (
          <input
            key={i}
            type="file"
            onChange={e => handleImageUpload(i, e.target.files[0])}
          />
        )
      )}
      <button type="button" onClick={addTextBlock}>Add Text Block</button>
      <button type="button" onClick={addImageBlock}>Add Image Block</button><br/>
      <button type="submit">Add Theory</button>
    </form>
  );
}

export default UploadForm;
