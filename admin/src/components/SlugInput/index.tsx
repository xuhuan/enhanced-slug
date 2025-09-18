import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { TextInput, Field, Flex, IconButton, Tooltip } from '@strapi/design-system';
import { ArrowClockwise } from '@strapi/icons';
import api from '../../utils/api';
import { getTranslation } from '../../utils/getTranslation';

interface SlugInputProps {
    value: string;
    onChange: (value: string) => void;
    sourceText?: string;        // 来源标题文本
    targetLang?: string;        // 目标语言（默认 zh-Hans -> en）
    disabled?: boolean;
}

const SlugInput: React.FC<SlugInputProps> = ({
    value,
    onChange,
    sourceText = '',
    targetLang = 'en',
    disabled = false,
}) => {
    const { formatMessage, locale } = useIntl();
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!sourceText) return;
        setLoading(true);
        try {
            const res = await api.post('/slug/generate', {
                text: sourceText,
                options: {
                    targetLang,
                },
            });
            if (res?.data?.slug) {
                onChange(res.data.slug);
            }
        } catch (err) {
            console.error('Slug generation failed:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Field
            name="slug"
            hint={formatMessage({
                id: getTranslation('slugInput.hint'),
                defaultMessage: 'URL-friendly identifier generated from title',
            })}
        >
            <Flex gap={2} alignItems="flex-end">
                <TextInput
                    label={formatMessage({
                        id: getTranslation('slugInput.label'),
                        defaultMessage: 'Slug',
                    })}
                    name="slug"
                    value={value}
                    onChange={(e: { target: { value: string; }; }) => onChange(e.target.value)}
                    disabled={disabled || loading}
                    placeholder={formatMessage({
                        id: getTranslation('slugInput.placeholder'),
                        defaultMessage: 'auto-generated slug',
                    })}
                />
                <Tooltip
                    description={formatMessage({
                        id: getTranslation('slugInput.generate'),
                        defaultMessage: 'Generate from title',
                    })}
                >
                    <IconButton
                        disabled={disabled || !sourceText || loading}
                        onClick={handleGenerate}
                        label={formatMessage({
                            id: getTranslation('slugInput.generate'),
                            defaultMessage: 'Generate from title',
                        })}
                        icon={<ArrowClockwise />}
                        loading={loading}
                    />
                </Tooltip>
            </Flex>
        </Field>
    );
};

export default SlugInput;
