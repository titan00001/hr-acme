import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import {
  useGetSalaryTemplateQuery,
  useGetSalaryTemplatesQuery,
} from '@/infrastructure/api/salary-templates-api';
import { ErrorHandler } from '@/presentation/components/feedback/error-handler';
import { PageHeader } from '@/presentation/components/layout/page-header';
import { CreateTemplateVersionDialog } from '@/presentation/components/salary/create-template-version-dialog';
import { DeleteTemplateDialog } from '@/presentation/components/salary/delete-template-dialog';
import { EditTemplateDialog } from '@/presentation/components/salary/edit-template-dialog';
import { TemplateSummaryCard } from '@/presentation/components/salary/template-summary-card';
import { Button } from '@/presentation/components/ui/button';

export function TemplateDetailPage(): React.ReactElement {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [versionOpen, setVersionOpen] = useState(false);

  const {
    data: template,
    isLoading,
    isError,
    error,
  } = useGetSalaryTemplateQuery(id, { skip: !id });

  const familyQuery = useMemo(
    () =>
      template
        ? {
            page: 1,
            limit: 50,
            search: template.name,
            sortBy: 'version',
            sortOrder: 'DESC' as const,
          }
        : undefined,
    [template],
  );

  const familyQueryResult = useGetSalaryTemplatesQuery(familyQuery ?? {}, {
    skip: !template,
  });

  const familyVersions = useMemo(() => {
    if (!template || !familyQueryResult.data) {
      return [];
    }
    return familyQueryResult.data.data.filter(
      (row) => row.name === template.name,
    );
  }, [template, familyQueryResult.data]);

  if (isLoading) {
    return (
      <main className="animate-slide-up">
        <p className="text-ink-muted" role="status">
          Loading template…
        </p>
      </main>
    );
  }

  if (isError || !template) {
    return (
      <main className="animate-slide-up space-y-4">
        <ErrorHandler
          error={error ?? { status: 404 }}
          defaultMessage="Unable to load template"
        />
        <Link to="/templates" className="text-sm text-brand hover:underline">
          Back to templates
        </Link>
      </main>
    );
  }

  return (
    <main className="animate-slide-up space-y-6">
      <PageHeader
        title={template.name}
        description={`Version ${template.version} · ${template.country} · ${template.currency}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setVersionOpen(true)}
            >
              Create version
            </Button>
            {!template.isAssigned ? (
              <>
                <Button type="button" onClick={() => setEditOpen(true)}>
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => setDeleteOpen(true)}
                >
                  Delete
                </Button>
              </>
            ) : (
              <p className="self-center text-sm text-ink-muted">
                Assigned templates are immutable — create a new version to
                change structure.
              </p>
            )}
          </div>
        }
      />

      <TemplateSummaryCard template={template} />

      <section className="space-y-3">
        <h2 className="font-display text-xl text-ink">Family versions</h2>
        {familyQueryResult.isError ? (
          <ErrorHandler
            error={familyQueryResult.error}
            defaultMessage="Unable to load family versions"
          />
        ) : familyVersions.length === 0 ? (
          <p className="text-sm text-ink-muted">No other versions found.</p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface shadow-xs">
            {familyVersions.map((version) => (
              <li key={version.id}>
                <Link
                  to={`/templates/${version.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition-theme hover:bg-brand-soft/40"
                >
                  <span className="font-medium text-ink">
                    v{version.version}
                    {version.id === template.id ? ' (current)' : ''}
                  </span>
                  <span className="text-ink-muted">
                    {version.isAssigned ? 'Assigned' : 'Unused'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link to="/templates" className="inline-block text-sm text-brand hover:underline">
        Back to templates
      </Link>

      <EditTemplateDialog
        open={editOpen}
        template={template}
        onClose={() => setEditOpen(false)}
      />
      <DeleteTemplateDialog
        open={deleteOpen}
        template={template}
        onClose={() => setDeleteOpen(false)}
        onSuccess={() => {
          void navigate('/templates');
        }}
      />
      <CreateTemplateVersionDialog
        open={versionOpen}
        template={template}
        onClose={() => setVersionOpen(false)}
        onSuccess={(newId) => {
          void navigate(`/templates/${newId}`);
        }}
      />
    </main>
  );
}
