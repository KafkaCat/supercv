import { forwardRef, Fragment } from 'react';
import { useResumeStore, SectionKey } from '../../store/useResumeStore';
import { Mail, Phone, MapPin, Link as LinkIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ResumePreview = forwardRef<HTMLDivElement, {}>((props, ref) => {
  void props;
  const { currentResume, sectionOrder } = useResumeStore();
  const { profile, educations, experiences, projects, skills, language } = currentResume;
  const { t } = useTranslation();

  // Helper to translate labels based on Resume Language (not App Language)
  const rt = (key: string) => t(key, { lng: language || 'zh' });

  const renderEducation = () => {
    if (educations.length === 0) return null;
    return (
      <section className="mb-6">
        <h2 className="text-sm font-bold text-gray-900 border-b border-gray-300 pb-1 mb-2 uppercase tracking-wider">{rt('sections.education')}</h2>
        <div className="space-y-4">
          {educations.map(edu => (
            <div key={edu.id}>
              <div className="flex justify-between font-bold mb-1">
                <span>{edu.school}</span>
                <span>{edu.startDate} - {edu.endDate}</span>
              </div>
              <div className="text-gray-700 mb-1">{edu.degree}</div>
              {edu.description && <div className="rich-text-content ql-editor text-gray-600" dangerouslySetInnerHTML={{ __html: edu.description }} />}
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderExperience = () => {
    if (experiences.length === 0) return null;
    return (
      <section className="mb-6">
        <h2 className="text-sm font-bold text-gray-900 border-b border-gray-300 pb-1 mb-2 uppercase tracking-wider">{rt('sections.experience')}</h2>
        <div className="space-y-4">
          {experiences.map(exp => (
            <div key={exp.id}>
              <div className="flex justify-between font-bold mb-1">
                <span>{exp.company}</span>
                <span>{exp.startDate} - {exp.endDate}</span>
              </div>
              <div className="font-semibold text-gray-700 mb-1">{exp.position}</div>
              {exp.description && <div className="rich-text-content ql-editor text-gray-600" dangerouslySetInnerHTML={{ __html: exp.description }} />}
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderProjects = () => {
    if (!projects || projects.length === 0) return null;
    return (
      <section className="mb-6">
        <h2 className="text-sm font-bold text-gray-900 border-b border-gray-300 pb-1 mb-2 uppercase tracking-wider">{rt('sections.projects') || 'Projects'}</h2>
        <div className="space-y-4">
          {projects.map(proj => (
            <div key={proj.id}>
              <div className="flex justify-between font-bold mb-1">
                <span>{proj.name}</span>
                <span>{proj.startDate} - {proj.endDate}</span>
              </div>
              <div className="font-semibold text-gray-700 mb-1">{proj.role}</div>
              {proj.description && <div className="rich-text-content ql-editor text-gray-600" dangerouslySetInnerHTML={{ __html: proj.description }} />}
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderSkills = () => {
    if (!skills.content || skills.content === '<p><br></p>') return null;
    return (
      <section className="mb-6">
        <h2 className="text-sm font-bold text-gray-900 border-b border-gray-300 pb-1 mb-2 uppercase tracking-wider">{rt('sections.skills')}</h2>
        <div className="rich-text-content ql-editor" dangerouslySetInnerHTML={{ __html: skills.content }} />
      </section>
    );
  };

  const renderSection = (section: SectionKey) => {
    switch (section) {
      case 'education':
        return renderEducation();
      case 'experience':
        return renderExperience();
      case 'projects':
        return renderProjects();
      case 'skills':
        return renderSkills();
      default:
        return null;
    }
  };

  return (
    <div className="flex justify-center print:block print:w-full print:h-auto">
      <div 
        ref={ref}
        id="resume-preview"
        className="bg-white shadow-lg print:shadow-none w-[210mm] min-h-[297mm] p-[15mm] text-gray-800 text-sm leading-normal box-border origin-top transform scale-75 xl:scale-90 2xl:scale-100 transition-transform print:transform-none print:w-full print:p-0 print:m-0"
        style={{ 
          fontFamily: '"Helvetica Neue", Helvetica, Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
          // Dynamic styles for smart fit
          // @ts-ignore
          '--resume-font-size': currentResume.layout?.fontSize || '14px',
          '--resume-line-height': currentResume.layout?.lineHeight || '1.5',
          '--resume-margin': currentResume.layout?.margin || '15mm',
          padding: 'var(--resume-margin)',
          fontSize: 'var(--resume-font-size)',
          lineHeight: 'var(--resume-line-height)'
        }}
      >
        {/* Header */}
        <header className="border-b-2 border-gray-800 pb-4 mb-6">
          <h1 className={`text-3xl font-bold mb-3 tracking-wide ${!profile.fullName ? 'text-gray-300 italic' : ''}`}>
            {profile.fullName || 'Your Name'}
          </h1>
          <div className="flex flex-wrap gap-4 text-xs text-gray-600">
            {profile.phone && (
              <div className="flex items-center gap-1">
                <Phone size={12} /> {profile.phone}
              </div>
            )}
            {profile.email && (
              <div className="flex items-center gap-1">
                <Mail size={12} /> {profile.email}
              </div>
            )}
            {profile.location && (
              <div className="flex items-center gap-1">
                <MapPin size={12} /> {profile.location}
              </div>
            )}
            {profile.link && (
              <div className="flex items-center gap-1">
                <LinkIcon size={12} /> {profile.link}
              </div>
            )}
          </div>
        </header>

        {/* Summary */}
        {profile.summary && profile.summary !== '<p><br></p>' && (
          <section className="mb-6">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-300 pb-1 mb-2 uppercase tracking-wider">{rt('fields.summary')}</h2>
            <div className="rich-text-content ql-editor" dangerouslySetInnerHTML={{ __html: profile.summary }} />
          </section>
        )}

        {sectionOrder.map((section) => (
          <Fragment key={section}>{renderSection(section)}</Fragment>
        ))}

      </div>
    </div>
  );
});

ResumePreview.displayName = 'ResumePreview';
