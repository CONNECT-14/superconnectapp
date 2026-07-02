export default function ProfileSkills({ skills }) {
  if (!skills || skills.length === 0) return null;

  return (
    <div className="skill-tags-container">
      {skills.map((skill, i) => (
        <span key={i} className="skill-tag">
          {skill}
        </span>
      ))}
    </div>
  );
}
