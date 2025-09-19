import React, { useState, useEffect } from 'react';
import { useIntl } from 'react-intl';
import {
    Field,
    FieldLabel,
    FieldHint,
    FieldError,
    FieldInput,
    Flex,
    Button,
} from '@strapi/design-system';
import { useNotification } from '@strapi/strapi/admin';
import { getTranslation } from '../../utils/getTranslation';
import api from '../../utils/api';

interface SlugInputProps {
    attribute: {
        sourceField?: string;
    };
    description?: {
        id: string;
        defaultMessage: string;
    };
    disabled?: boolean;
    error?: string;
    intlLabel: {
        id: string;
        defaultMessage: string;
    };
    name: string;
    onChange: (event: { target: { name: string; value: string; type: string } }) => void;
    required?: boolean;
    value?: string;
    // Access to other form fields
    allFields?: Record<string, any>;
}

const SlugInput: React.FC<SlugInputProps> = ({
    attribute,
    description,
    disabled,
    error,
    intlLabel,
    name,
    onChange,
    required,
    value,
    allFields,
}) => {
    const { formatMessage } = useIntl();
    const { toggleNotification } = useNotification();
    const [isGenerating, setIsGenerating] = useState(false);
    const [localValue, setLocalValue] = useState(value || '');

    useEffect(() => {
        setLocalValue(value || '');
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        onChange({
            target: {
                name,
                value: newValue,
                type: 'text',
            },
        });
    };

    const handleGenerate = async () => {
        // Get source field value
        const sourceField = attribute?.sourceField || 'title';
        const sourceValue = allFields?.[sourceField] || '';

        if (!sourceValue) {
            toggleNotification({
                type: 'warning',
                message: `No content in ${sourceField} field to generate slug from`,
            });
            return;
        }

        setIsGenerating(true);
        try {
            const response = await api.post('/generate', {
                text: sourceValue,
            });

            if (response.data?.slug) {
                const newSlug = response.data.slug;
                setLocalValue(newSlug);
                onChange({
                    target: {
                        name,
                        value: newSlug,
                        type: 'text',
                    },
                });
                toggleNotification({
                    type: 'success',
                    message: 'Slug generated successfully',
                });
            } else {
                throw new Error('No slug returned');
            }
        } catch (err) {
            toggleNotification({
                type: 'danger',
                message: formatMessage({ id: getTranslation('input.error') }),
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Field
            name={name}
            id={name}
            error={error}
            hint={description && formatMessage(description)}
            required={required}
        >
            <FieldLabel>{formatMessage(intlLabel)}</FieldLabel>
            <Flex gap={2}>
                <FieldInput
                    type="text"
                    placeholder={formatMessage({ id: getTranslation('input.placeholder') })}
                    value={localValue}
                    onChange={handleInputChange}
                    disabled={disabled || isGenerating}
                />
                <Button
                    onClick={handleGenerate}
                    loading={isGenerating}
                    disabled={disabled}
                    variant="secondary"
                >
                    {formatMessage({
                        id: getTranslation(isGenerating ? 'input.generating' : 'input.generate')
                    })}
                </Button>
            </Flex>
            {description && <FieldHint />}
            {error && <FieldError />}
        </Field>
    );
};

export default SlugInput;
