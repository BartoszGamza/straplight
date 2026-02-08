import React, { useEffect, useState } from 'react';
import { Layouts, useNotification, getFetchClient } from '@strapi/strapi/admin';
import {
  Box,
  Button,
  Field,
  Typography,
  NumberInput,
  Switch,
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  Flex,
  Grid,
  MultiSelect,
  MultiSelectOption,
} from '@strapi/design-system';
import { PLUGIN_ID } from '../pluginId';

interface ContentTypeInfo {
  uid: string;
  displayName: string;
  fields: { name: string; type: string }[];
  mainField: string;
}

interface ContentTypeSettings {
  enabled: boolean;
  displayFields: string[];
}

interface StraplightSettings {
  debounceMs: number;
  minQueryLength: number;
  contentTypes: Record<string, ContentTypeSettings>;
}

const DEFAULTS: StraplightSettings = {
  debounceMs: 200,
  minQueryLength: 1,
  contentTypes: {},
};

export function SettingsPage() {
  const [settings, setSettings] = useState<StraplightSettings>(DEFAULTS);
  const [contentTypes, setContentTypes] = useState<ContentTypeInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toggleNotification } = useNotification();

  useEffect(() => {
    const { get } = getFetchClient();
    get(`/${PLUGIN_ID}/settings`)
      .then(({ data }: any) => {
        setSettings({ ...DEFAULTS, ...data.settings });
        setContentTypes(data.contentTypes || []);
      })
      .catch(() => {
        toggleNotification({
          type: 'danger',
          message: 'Failed to load settings',
        });
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { put } = getFetchClient();
      const { data } = (await put(`/${PLUGIN_ID}/settings`, settings)) as any;
      setSettings({ ...DEFAULTS, ...data.settings });
      toggleNotification({
        type: 'success',
        message: 'Settings saved successfully',
      });
    } catch {
      toggleNotification({
        type: 'danger',
        message: 'Failed to save settings',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateContentType = (uid: string, update: Partial<ContentTypeSettings>) => {
    setSettings((prev) => ({
      ...prev,
      contentTypes: {
        ...prev.contentTypes,
        [uid]: {
          ...{
            enabled: prev.contentTypes[uid]?.enabled !== false,
            displayFields: prev.contentTypes[uid]?.displayFields || [],
          },
          ...prev.contentTypes[uid],
          ...update,
        },
      },
    }));
  };

  if (isLoading) {
    return (
      <Layouts.Root>
        <Layouts.Header title="Straplight" subtitle="Configure the search overlay" />
        <Layouts.Content>
          <Box padding={8}>
            <Typography>Loading...</Typography>
          </Box>
        </Layouts.Content>
      </Layouts.Root>
    );
  }

  return (
    <Layouts.Root>
      <Layouts.Header
        title="Straplight"
        subtitle="Configure the search overlay"
        primaryAction={
          <Button onClick={handleSave} loading={isSaving}>
            Save
          </Button>
        }
      />
      <Layouts.Content>
        <Box padding={8} background="neutral0" shadow="filterShadow" hasRadius>
          <Flex direction="column" alignItems="stretch" gap={6}>
            <Typography variant="delta" tag="h2">
              General
            </Typography>
            <Grid.Root gap={6}>
              <Grid.Item col={6} s={12} direction="column" alignItems="stretch">
                <Field.Root id="delay-input" hint="Debounce delay before triggering search (ms)">
                  <Field.Label>Delay</Field.Label>
                  <NumberInput
                    id="delay-input"
                    name="debounceMs"
                    value={settings.debounceMs}
                    onValueChange={(value: number) =>
                      setSettings((prev) => ({ ...prev, debounceMs: value ?? 200 }))
                    }
                    step={50}
                  />
                  <Field.Hint />
                </Field.Root>
              </Grid.Item>
              <Grid.Item col={6} s={12} direction="column" alignItems="stretch">
                <Field.Root id="min-query-input" hint="Minimum query length to trigger search">
                  <Field.Label>Min characters</Field.Label>
                  <NumberInput
                    label="Min characters"
                    name="minQueryLength"
                    value={settings.minQueryLength}
                    onValueChange={(value: number) =>
                      setSettings((prev) => ({ ...prev, minQueryLength: Math.max(1, value ?? 1) }))
                    }
                    step={1}
                  />
                  <Field.Hint />
                </Field.Root>
              </Grid.Item>
            </Grid.Root>
          </Flex>
        </Box>

        <Box padding={8} marginTop={6} background="neutral0" shadow="filterShadow" hasRadius>
          <Flex direction="column" alignItems="stretch" gap={6}>
            <Flex direction="column" alignItems="start" gap={1}>
              <Typography variant="delta" tag="h2">
                Content Types
              </Typography>
              <Typography variant="pi" textColor="neutral600">
                Choose which content types are searchable and what fields to display in results
              </Typography>
            </Flex>

            <Table colCount={3} rowCount={contentTypes.length}>
              <Thead>
                <Tr>
                  <Th>
                    <Typography variant="sigma">Enabled</Typography>
                  </Th>
                  <Th>
                    <Typography variant="sigma">Content Type</Typography>
                  </Th>
                  <Th>
                    <Typography variant="sigma">Additional display fields</Typography>
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {contentTypes.map((ct) => {
                  const ctSettings = settings.contentTypes[ct.uid];
                  const isEnabled = ctSettings?.enabled !== false;
                  const displayFields = ctSettings?.displayFields || [];
                  // Exclude the main field from display field options since it's already the label
                  const availableFields = ct.fields.filter((f) => f.name !== ct.mainField);

                  return (
                    <Tr key={ct.uid}>
                      <Td>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(checked: boolean) =>
                            updateContentType(ct.uid, { enabled: checked })
                          }
                          visibleLabels
                        />
                      </Td>
                      <Td>
                        <Flex direction="column" alignItems="start" gap={1}>
                          <Typography fontWeight="bold">{ct.displayName}</Typography>
                          <Typography variant="pi" textColor="neutral500">
                            {ct.uid}
                          </Typography>
                        </Flex>
                      </Td>
                      <Td>
                        <MultiSelect
                          placeholder="Select fields..."
                          value={displayFields}
                          onChange={(values: string[]) => {
                            if (values.length <= 2) {
                              updateContentType(ct.uid, { displayFields: values });
                            }
                          }}
                          disabled={!isEnabled}
                          withTags
                        >
                          {availableFields.map((field) => (
                            <MultiSelectOption key={field.name} value={field.name}>
                              {field.name}
                            </MultiSelectOption>
                          ))}
                        </MultiSelect>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Flex>
        </Box>
      </Layouts.Content>
    </Layouts.Root>
  );
}

export default SettingsPage;
