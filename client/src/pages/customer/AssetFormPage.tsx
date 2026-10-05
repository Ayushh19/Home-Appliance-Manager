import { assetSchema, type AssetInput, OTHER } from '@ham/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api, fieldErrorsOf } from '../../lib/api';
import { todayIso } from '../../lib/format';
import { validate } from '../../lib/form';
import { keys, useAsset, useBrands, useCategories, useHome } from '../../lib/queries';
import { FormError } from '../../ui/Alert';
import { Button, buttonClass } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { PageHeader } from '../../ui/PageHeader';
import { SelectField } from '../../ui/SelectField';
import { Skeleton } from '../../ui/Skeleton';
import { TextAreaField } from '../../ui/TextAreaField';
import { TextField } from '../../ui/TextField';

type FormState = Record<keyof AssetInput, string>;
const EMPTY: FormState = {
  categoryId: '',
  brandId: '',
  name: '',
  customCategory: '',
  customBrand: '',
  model: '',
  serialNumber: '',
  purchaseDate: '',
  purchasePrice: '',
  notes: '',
};

/** Add an asset (route has :homeId) or edit one (route has :assetId). */
export function AssetFormPage() {
  const { homeId, assetId } = useParams();
  const editing = Boolean(assetId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const categories = useCategories();
  const brands = useBrands();
  const asset = useAsset(assetId ?? '');
  const home = useHome(homeId ?? asset.data?.homeId ?? '');

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (key: keyof FormState) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    if (editing && asset.data) {
      const a = asset.data;
      setForm({
        categoryId: a.categoryId,
        brandId: a.brandId,
        name: a.name ?? '',
        customCategory: a.customCategory ?? '',
        customBrand: a.customBrand ?? '',
        model: a.model ?? '',
        serialNumber: a.serialNumber ?? '',
        purchaseDate: a.purchaseDate ?? '',
        purchasePrice: a.purchasePrice?.toString() ?? '',
        notes: a.notes ?? '',
      });
    }
  }, [editing, asset.data]);

  const save = useMutation({
    mutationFn: async (input: AssetInput) => {
      if (editing) {
        await api<void>(`/assets/${assetId}`, { method: 'PATCH', body: input });
        return assetId!;
      }
      const created = await api<{ id: string }>(`/homes/${homeId}/assets`, { method: 'POST', body: input });
      return created.id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: keys.homes });
      queryClient.invalidateQueries({ queryKey: keys.asset(id) });
      navigate(`/app/assets/${id}`);
    },
    onError: (err) => setErrors(fieldErrorsOf(err)),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = validate(assetSchema, form);
    setErrors(result.errors ?? {});
    if (result.data) save.mutate(form);
  };

  const otherCategoryId = categories.data?.find((c) => c.name === OTHER)?.id;
  const otherBrandId = brands.data?.find((b) => b.name === OTHER)?.id;
  const cancelTo = editing ? `/app/assets/${assetId}` : `/app/homes/${homeId}`;
  const loading = categories.isPending || brands.isPending || (editing && asset.isPending);
  const loadError = categories.error ?? brands.error ?? (editing ? asset.error : null);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        back={{ to: cancelTo, label: editing ? 'Back to asset' : (home.data?.name ?? 'Back') }}
        title={editing ? 'Edit asset' : 'Add an asset'}
        subtitle={editing ? undefined : 'Only the type and brand are required. You can add warranties and documents on the next screen.'}
      />

      {loadError ? (
        <FormError message={loadError.message} />
      ) : loading ? (
        <Skeleton className="h-96" />
      ) : (
        <Card className="animate-fade-up">
          <form onSubmit={onSubmit} noValidate className="space-y-6">
            <FormError message={save.error?.message} />
            <div className="grid gap-5 md:grid-cols-2">
              <TextField
                label="Name (optional)"
                placeholder="e.g. Bedroom AC, Kitchen fridge"
                hint="Helps tell similar assets apart."
                className="md:col-span-2"
                value={form.name}
                onChange={set('name')}
                error={errors.name}
              />
              <SelectField
                label="Type"
                placeholder="Select a type"
                options={categories.data!.map((c) => ({ value: c.id, label: c.name }))}
                value={form.categoryId}
                onChange={set('categoryId')}
                error={errors.categoryId}
              />
              <SelectField
                label="Brand"
                placeholder="Select a brand"
                options={brands.data!.map((b) => ({ value: b.id, label: b.name }))}
                value={form.brandId}
                onChange={set('brandId')}
                error={errors.brandId}
              />
              {form.categoryId && form.categoryId === otherCategoryId && (
                <TextField
                  label="Which type? (optional)"
                  placeholder="e.g. Inverter, Treadmill"
                  className="md:col-start-1"
                  value={form.customCategory}
                  onChange={set('customCategory')}
                  error={errors.customCategory}
                />
              )}
              {form.brandId && form.brandId === otherBrandId && (
                <TextField
                  label="Which brand? (optional)"
                  className="md:col-start-2"
                  value={form.customBrand}
                  onChange={set('customBrand')}
                  error={errors.customBrand}
                />
              )}
              <TextField label="Model (optional)" value={form.model} onChange={set('model')} error={errors.model} />
              <TextField
                label="Serial number (optional)"
                className="[&_input]:font-mono"
                value={form.serialNumber}
                onChange={set('serialNumber')}
                error={errors.serialNumber}
              />
              <TextField
                label="Purchase date (optional)"
                type="date"
                max={todayIso()}
                value={form.purchaseDate}
                onChange={set('purchaseDate')}
                error={errors.purchaseDate}
              />
              <TextField
                label="Purchase price in ₹ (optional)"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.purchasePrice}
                onChange={set('purchasePrice')}
                error={errors.purchasePrice}
              />
              <TextAreaField
                label="Notes (optional)"
                className="md:col-span-2"
                value={form.notes}
                onChange={set('notes')}
                error={errors.notes}
              />
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link to={cancelTo} className={buttonClass('ghost')}>
                Cancel
              </Link>
              <Button type="submit" loading={save.isPending}>
                {editing ? 'Save changes' : 'Add asset'}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
