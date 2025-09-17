import React, { useState, useEffect } from 'react';
import { unstable_useContentManagerContext as useContentManagerContext } from '@strapi/strapi/admin';
import { useFetchClient } from '@strapi/strapi/admin';
// v2 核心变更: 导入 Flex, 它替代了 Stack
import { TextInput, Button, Flex } from '@strapi/design-system';
// v2 核心变更: Refresh -> ArrowClockwise, 或者 ArrowsCounterClockwise 也可以
import { ArrowClockwise } from '@strapi/icons';
import { PLUGIN_ID } from '../../pluginId';

interface FormDataType {
    values: { [key: string]: any };
    initialValues: { [key: string]: any };
}

interface InputProps {
    name: string;
    value: string | null;
    onChange: (event: { target: { name: string; value: string; type: string } }) => void;
    attribute: {
        options?: {
            sourceField?: string;
        };
    };
}

const InputComponent: React.FC<InputProps> = ({ name, value, onChange, attribute }) => {
    const { isCreatingEntry, form } = useContentManagerContext();
    const { values: modifiedData } = form as FormDataType;

    const [isLoading, setIsLoading] = useState(false);
    const { post } = useFetchClient();
    const sourceFieldName = attribute.options?.sourceField;

    const handleGenerateSlug = async () => {
        if (!sourceFieldName || !modifiedData[sourceFieldName]) {
            console.warn('Source field is empty or not configured.');
            return;
        }
        setIsLoading(true);
        try {
            // 确保这里的路由是 generate 而不是 generates
            const response = await post(`/${PLUGIN_ID}/generate`, {
                sourceText: modifiedData[sourceFieldName],
            });
            const { slug } = response.data;
            onChange({ target: { name, value: slug, type: 'string' } });
        } catch (error) {
            console.error('Failed to generate slug:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const sourceValue = sourceFieldName ? modifiedData[sourceFieldName] : undefined;
        if (sourceValue && isCreatingEntry && !value) {
            const timer = setTimeout(() => handleGenerateSlug(), 500);
            return () => clearTimeout(timer);
        }
    }, [sourceFieldName, modifiedData[sourceFieldName ?? '']]); // 修正依赖项

    return (
        // v2 核心变更: 使用 Flex 替代 Stack
        <Flex direction="column" alignItems="stretch" gap={1}>
            <TextInput
                label="Enhanced Slug"
                name={name}
                value={value || ''}
                onChange={onChange}
                endAction={
                    <Button
                        startIcon={<ArrowClockwise />}
                        onClick={handleGenerateSlug}
                        variant="secondary"
                        loading={isLoading}
                        disabled={!sourceFieldName || !modifiedData[sourceFieldName]}
                    >
                        Regenerate
                    </Button>
                }
            />
        </Flex>
    );
};

export default InputComponent;
