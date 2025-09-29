import React, { useEffect, useState, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { ArrowClockwise, Earth } from '@strapi/icons';
import { useLocation } from 'react-router-dom';
import { unstable_useContentManagerContext as useContentManagerContext } from '@strapi/strapi/admin';
import { getFetchClient } from '@strapi/strapi/admin';
import { Field } from '@strapi/design-system';
import { PLUGIN_ID } from '../../pluginId';
import { slugify } from '../../../../server/src/utils/slug';

// 定义类型接口
interface SlugInputProps {
  name: string;
  label: string;
  value: string;
  attribute: any;
  onChange: (event: { target: { name: string; value: string } }) => void;
}

interface FormData {
  initialValues?: Record<string, any>;
  values?: Record<string, any>;
}

interface ContentType {
  attributes?: Record<
    string,
    {
      pluginOptions?: {
        i18n?: {
          localized?: boolean;
        };
      };
    }
  >;
}

interface ContentManagerContext {
  id?: string;
  contentType?: ContentType;
  model?: string;
  form?: FormData;
}

interface Theme {
  colors?: {
    neutral400?: string;
    primary600?: string;
    warning500?: string;
    success500?: string;
  };
}

// 优化的防抖 hook
const useDebounce = <T extends any[]>(callback: (...args: T) => void, delay: number) => {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 始终保存最新的 callback，但不作为依赖项
  callbackRef.current = callback;

  const debouncedCallback = useCallback(
    (...args: T) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay] // 只依赖 delay
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { debouncedCallback, cancel };
};

const SlugInput = (props: SlugInputProps) => {
  const { name, label, value, attribute, onChange } = props;

  const context = useContentManagerContext() as ContentManagerContext;
  const { id, contentType, model, form } = context;

  const initialValues = form?.initialValues || {};
  const modifiedData = form?.values || {};

  const [currentLocale, setCurrentLocale] = useState<string>('');
  const [inputSlug, setInputSlug] = useState<string>(value || '');
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [reGenerate, setReGenerate] = useState<boolean>(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState<boolean>(false);
  const [isManuallyEdited, setIsManuallyEdited] = useState<boolean>(false);

  // 使用 ref 存储需要在防抖函数中使用的值
  const lastSourceValueRef = useRef<string>('');
  const contextRef = useRef({ id, model, currentLocale, attribute, onChange, name });
  const sourceFieldRef = useRef<string>(attribute?.options?.sourceField || 'title');

  // 更新 refs
  useEffect(() => {
    contextRef.current = { id, model, currentLocale, attribute, onChange, name };
  });

  useEffect(() => {
    sourceFieldRef.current = attribute?.options?.sourceField || 'title';
  }, [attribute?.options?.sourceField]);

  console.log('SlugInput Props:', props);
  console.log('contentType Props:', contentType);
  console.log('Form values (modifiedData):', modifiedData);
  console.log('Attribute options:', attribute?.options);

  const uid: string = model || '';
  const key: string = name;
  const sourceField = attribute?.options?.sourceField || 'title';
  const hasSourceField = contentType?.attributes?.hasOwnProperty(sourceField);
  const isI18nEnabled: boolean =
    contentType?.attributes?.[name]?.pluginOptions?.i18n?.localized || false;
  console.log('SlugInput Props isI18nEnabled:', isI18nEnabled);

  // 只有在启用了 i18n 时才追加语言后缀
  const ensureLocaleInSlug = (slug: string) => {
    if (isI18nEnabled && currentLocale && !slug.endsWith(`-${currentLocale}`)) {
      return `${slug}-${currentLocale}`;
    }
    return slug;
  };

  useEffect(() => {
    if (!hasSourceField) {
      setError(
        `Source field '${sourceField}' not found. Please configure the source field in the field options.`
      );
      setIsValid(false);
    } else {
      setError(null);
    }
  }, [hasSourceField, sourceField]);

  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location?.search);
    const locale = params?.get('plugins[i18n][locale]');
    setCurrentLocale(locale || '');
  }, [location]);

  const validateSlug = async (slug: string) => {
    const { post } = getFetchClient();
    setIsLoading(true);

    try {
      const response = await post(`/${PLUGIN_ID}/check-slug`, {
        id,
        slug,
        key,
        uid,
        currentLocale,
        locale: currentLocale,
      });

      const data = response?.data;
      const result = data?.result || data?.data?.result;

      if (!result) {
        throw new Error('Invalid response format');
      }

      const { isValid: slugIsValid, message } = result;
      setIsLoading(false);

      if (!slugIsValid) {
        setError(message || 'Slug is not valid');
        setIsValid(false);
        setReGenerate(true);
        return false;
      }

      setError(null);
      setIsValid(true);
      setReGenerate(false);
      return true;
    } catch (error) {
      console.error('Validation error:', error);
      setError('An error occurred while validating the slug.');
      setIsLoading(false);
      return false;
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputSlug(newValue);
    setIsValid(null);
    setIsManuallyEdited(true); // 标记为手动编辑

    if (!newValue?.trim() && attribute?.required) {
      setError('Slug cannot be empty');
      setIsValid(false);
      setInputSlug('');
      onChange?.({ target: { name, value: '' } });
      return;
    }

    // 验证时使用完整的 slug（包含语言后缀）
    const fullSlug = ensureLocaleInSlug(newValue);
    const isValidSlug = await validateSlug(fullSlug);
    if (isValidSlug) {
      onChange?.({ target: { name, value: fullSlug } });
      setTimeout(() => setIsValid(null), 3000);
    }
  };

  // 将 generateSlug 逻辑提取为独立函数，减少依赖
  const performSlugGeneration = async (sourceValue: string, isManual: boolean = false) => {
    console.log('Generating slug from:', sourceFieldRef.current, '=', sourceValue, 'Manual:', isManual);

    if (!sourceValue) {
      if (isManual) {
        setError(`No content in "${sourceFieldRef.current}" field to generate slug from`);
      }
      return;
    }

    if (typeof sourceValue !== 'string' || !sourceValue.trim()) {
      if (isManual) {
        setError(`Source field "${sourceFieldRef.current}" must be a non-empty string`);
      }
      return;
    }

    // 如果是自动生成且值没有真正改变，则跳过
    if (!isManual && lastSourceValueRef.current === sourceValue.trim()) {
      return;
    }

    setIsLoading(true);
    if (!isManual) {
      setIsAutoGenerating(true);
    }

    try {
      const { post } = getFetchClient();
      const currentContext = contextRef.current;

      const response = await post(`/${PLUGIN_ID}/generate`, {
        text: sourceValue.trim(),
        mode: currentContext.attribute?.options?.mode || 'translation',
        targetLang: currentContext.attribute?.options?.targetLang || 'en',
      });

      if (response?.data?.data?.slug) {
        const generatedSlug = response.data.data.slug;
        const finalSlug = ensureLocaleInSlug(generatedSlug);

        // 在输入框中也显示完整的 slug（包含语言后缀）
        setInputSlug(finalSlug);
        currentContext.onChange?.({ target: { name: currentContext.name, value: finalSlug } });

        await validateSlug(finalSlug);
        lastSourceValueRef.current = sourceValue.trim();
      } else {
        throw new Error('No slug returned from service');
      }
    } catch (error: any) {
      console.error('Error generating slug:', error);

      if (isManual) {
        setError('Failed to generate slug from service. Falling back to local generation.');

        const localSlug = slugify(sourceValue);
        const finalSlug = ensureLocaleInSlug(localSlug);
        setInputSlug(finalSlug);
        contextRef.current.onChange?.({ target: { name: contextRef.current.name, value: finalSlug } });

        await validateSlug(finalSlug);
      }
    } finally {
      setIsLoading(false);
      if (!isManual) {
        setIsAutoGenerating(false);
      }
    }
  };

  // 优化的防抖实现 - 只依赖 delay
  const { debouncedCallback: debouncedGenerateSlug } = useDebounce(
    (sourceValue: string) => {
      performSlugGeneration(sourceValue, false);
    },
    1500
  );

  // 监听源字段变化
  useEffect(() => {
    const sourceValue = modifiedData?.[sourceField];
    const initialSourceValue = initialValues?.[sourceField];

    console.log('Source value changed:', {
      sourceValue,
      initialSourceValue,
      lastValue: lastSourceValueRef.current,
      sourceField,
      isManuallyEdited
    });

    // 如果用户手动编辑过，不自动生成
    if (isManuallyEdited) {
      console.log('Skipping auto-generation: manually edited');
      return;
    }

    // 只有在源字段真正改变时才触发
    if (
      sourceValue &&
      typeof sourceValue === 'string' &&
      sourceValue.trim() &&
      sourceValue !== initialSourceValue &&
      sourceValue.trim() !== lastSourceValueRef.current
    ) {
      console.log('Triggering debounced auto-generation for:', sourceValue);
      debouncedGenerateSlug(sourceValue);
    }
  }, [modifiedData?.[sourceField], sourceField, initialValues?.[sourceField], debouncedGenerateSlug, isManuallyEdited]);

  const handleReGenerate = async () => {
    const sourceValue = modifiedData?.[sourceField];
    if (sourceValue) {
      setIsLoading(true);
      setIsManuallyEdited(false); // 重新生成时重置手动编辑标记
      try {
        const { post } = getFetchClient();
        const counter = Math.floor(Math.random() * 1000);
        const textWithSuffix = `${sourceValue}-${counter}`;

        const response = await post(`/${PLUGIN_ID}/generate`, {
          text: textWithSuffix,
          mode: attribute?.options?.mode || 'translation',
          targetLang: attribute?.options?.targetLang || 'en',
        });

        if (response?.data?.data?.slug) {
          const generatedSlug = response.data.data.slug;
          const finalSlug = ensureLocaleInSlug(generatedSlug);

          setInputSlug(finalSlug);
          onChange?.({ target: { name, value: finalSlug } });
          await validateSlug(finalSlug);
        } else {
          const localSlug = slugify(textWithSuffix);
          const finalSlug = ensureLocaleInSlug(localSlug);
          setInputSlug(finalSlug);
          onChange?.({ target: { name, value: finalSlug } });
          await validateSlug(finalSlug);
        }
      } catch (error) {
        console.error('Error regenerating slug:', error);
        const counter = Math.floor(Math.random() * 1000);
        const localSlug = slugify(sourceValue + `-${counter}`);
        const finalSlug = ensureLocaleInSlug(localSlug);
        setInputSlug(finalSlug);
        onChange?.({ target: { name, value: finalSlug } });
        await validateSlug(finalSlug);
      } finally {
        setIsLoading(false);
        setReGenerate(false);
      }
    }
  };

  const handleManualGenerate = () => {
    const sourceValue = modifiedData?.[sourceField];
    if (sourceValue) {
      setIsManuallyEdited(false); // 手动生成时重置手动编辑标记
      performSlugGeneration(sourceValue, true);
    }
  };

  return (
    <Field.Root
      label={name}
      required={attribute?.required}
      error={error}
      hint={
        <>
          Slug will be generated from "{sourceField}" field using translation service
          {isAutoGenerating && (
            <span style={{ color: '#f29d41', marginLeft: '8px' }}>⏳ Auto-generating...</span>
          )}
        </>
      }
    >
      <span style={{ display: 'flex', alignItems: 'center' }}>
        <Field.Label>{label}</Field.Label>
        {isI18nEnabled && (
          <Earth
            className="i18n-icon"
            aria-hidden="true"
            style={{ marginLeft: '0.2rem' }}
            width="13px"
          />
        )}
      </span>

      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
        <div style={{ flex: 1 }}>
          <Field.Input
            name={name}
            value={inputSlug}
            onChange={handleInputChange}
            aria-describedby={error ? `${name}-error` : undefined}
            endAction={
              <span>
                {isLoading ? (
                  <StyledFieldContainer>
                    <span className="loading-icon-text">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 32 32"
                        width="1rem"
                        height="1rem"
                        fill="#f29d41"
                        className="loading-icon"
                      >
                        <path
                          fill="#f29d41"
                          d="M17.5 4v4a1.5 1.5 0 1 1-3 0V4a1.5 1.5 0 1 1 3 0m4.156 7.844a1.5 1.5 0 0 0 1.062-.44l2.828-2.829a1.503 1.503 0 1 0-2.125-2.125l-2.825 2.833a1.5 1.5 0 0 0 1.06 2.56M28 14.5h-4a1.5 1.5 0 1 0 0 3h4a1.5 1.5 0 1 0 0-3m-5.282 6.096a1.501 1.501 0 0 0-2.451 1.638c.075.182.186.348.326.487l2.828 2.829a1.503 1.503 0 0 0 2.125-2.125zM16 22.5a1.5 1.5 0 0 0-1.5 1.5v4a1.5 1.5 0 1 0 3 0v-4a1.5 1.5 0 0 0-1.5-1.5m-6.717-1.904-2.83 2.829A1.503 1.503 0 0 0 8.58 25.55l2.829-2.829a1.503 1.503 0 0 0-2.125-2.125M9.5 16A1.5 1.5 0 0 0 8 14.5H4a1.5 1.5 0 1 0 0 3h4A1.5 1.5 0 0 0 9.5 16m-.925-9.546A1.503 1.503 0 0 0 6.45 8.579l2.833 2.825a1.503 1.503 0 0 0 2.125-2.125z"
                        />
                      </svg>
                      Generating...
                    </span>
                  </StyledFieldContainer>
                ) : isValid ? (
                  <StyledFieldContainer>
                    <span className="available-icon-text">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="1rem"
                        height="1rem"
                        fill="none"
                        viewBox="0 0 24 24"
                        className="available-icon"
                      >
                        <path
                          fill="#008000"
                          fillRule="evenodd"
                          d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12Zm-1.438-11.066L16.158 7.5 18 9.245l-7.438 7.18-4.462-4.1 1.84-1.745 2.622 2.354Z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Available
                    </span>
                  </StyledFieldContainer>
                ) : (
                  reGenerate && (
                    <StyledFieldContainer>
                      <ArrowClockwise onClick={handleReGenerate} style={{ cursor: 'pointer' }} />
                    </StyledFieldContainer>
                  )
                )}
              </span>
            }
          />
        </div>

        <button
          type="button"
          onClick={handleManualGenerate}
          disabled={isLoading}
          style={{
            padding: '8px 12px',
            backgroundColor: '#4945ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            whiteSpace: 'nowrap',
          }}
        >
          {isLoading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      <Field.Hint>
        Source: "{sourceField}" | Auto-generation delay: 1.5s | Mode:{' '}
        {attribute?.options?.mode || 'translation'}
        {isI18nEnabled && currentLocale && ` | i18n: enabled (${currentLocale})`}
      </Field.Hint>
      {error && <Field.Error>{error}</Field.Error>}
    </Field.Root>
  );
};

export default SlugInput;

const StyledFieldContainer = styled.div<{ theme?: Theme }>`
  svg {
    height: 1rem;
    width: 1rem;
    path {
      fill: ${({ theme }) => theme?.colors?.neutral400 || '#666'};
    }
  }
  &:hover svg path {
    fill: ${({ theme }) => theme?.colors?.primary600 || '#4945ff'};
  }

  span {
    font-size: 12px;
    margin-left: 0.5rem;
  }

  .field-label-icon {
    margin-right: 0.5rem;
  }

  .i18n-icon {
    svg {
      path:first-of-type {
        fill: ${({ theme }) => theme?.colors?.warning500 || '#f29d41'};
      }
      path:last-of-type {
        fill: ${({ theme }) => theme?.colors?.warning500 || '#f29d41'};
      }
    }
  }

  .loading-icon {
    path {
      fill: ${({ theme }) => theme?.colors?.warning500 || '#f29d41'};
    }
    animation: fadeInOut 3s ease-in-out;
  }

  .available-icon {
    path {
      fill: ${({ theme }) => theme?.colors?.success500 || '#008000'};
    }
  }

  .loading-icon-text,
  .available-icon-text {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    color: ${({ theme }) => theme?.colors?.warning500 || '#f29d41'};
  }

  .available-icon-text {
    animation: fadeInOut 3s ease-in-out;
    color: ${({ theme }) => theme?.colors?.success500 || '#008000'};
  }

  .loading-icon-text {
    animation: fadeInOut 3s ease-in-out;
    color: ${({ theme }) => theme?.colors?.warning500 || '#f29d41'};
  }

  .loading-icon {
    path {
      fill: ${({ theme }) => theme?.colors?.warning500 || '#f29d41'};
    }
    animation: spin 1s linear infinite;
  }

  @keyframes fadeInOut {
    0%,
    100% {
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
  }
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;
