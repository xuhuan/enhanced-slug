import React, { useEffect, useState, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { ArrowClockwise, Earth } from '@strapi/icons';
import { useLocation } from 'react-router-dom';
import { unstable_useContentManagerContext as useContentManagerContext, useFetchClient } from '@strapi/strapi/admin';
import { Field } from '@strapi/design-system';
import { useIntl } from 'react-intl'; // 引入 useIntl
import { PLUGIN_ID } from '../../pluginId';
import { getTranslation } from '../../utils/getTranslation'; // 引入 getTranslation
import { slugify } from '../../../../server/src/utils/slug';

// --- 常量定义 ---
const CONSTANTS = {
  DEBOUNCE_DELAY: 1500,
  SUCCESS_MSG_DELAY: 3000,
  RETRY_DELAY: 100,
  COLORS: {
    WARNING: '#f29d41',
    SUCCESS: '#008000',
    PRIMARY: '#4945ff',
    NEUTRAL: '#666',
    WHITE: '#ffffff',
  }
};

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
    [delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { debouncedCallback };
};

const SlugInput = (props: SlugInputProps) => {
  const { name, label, value, attribute, onChange } = props;
  const { formatMessage } = useIntl(); // 获取 formatMessage

  const context = useContentManagerContext() as ContentManagerContext;
  const { id, contentType, model, form } = context;
  const { get, post } = useFetchClient();

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

  const [alwaysAppendSuffix, setAlwaysAppendSuffix] = useState<boolean>(true);

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

  // 获取插件全局设置
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await get(`/${PLUGIN_ID}/settings`);
        if (data && typeof data.alwaysAppendLocaleSuffix !== 'undefined') {
          setAlwaysAppendSuffix(data.alwaysAppendLocaleSuffix);
        }
      } catch (err) {
        console.error('Failed to fetch plugin settings', err);
      }
    };
    fetchSettings();
  }, [get]);

  const uid: string = model || '';
  const key: string = name;
  const sourceField = attribute?.options?.sourceField || 'title';
  const hasSourceField = contentType?.attributes?.hasOwnProperty(sourceField);
  const isI18nEnabled: boolean =
    contentType?.attributes?.[name]?.pluginOptions?.i18n?.localized || false;

  const ensureLocaleInSlug = (slug: string, force: boolean = false) => {
    if (isI18nEnabled && currentLocale) {
      if ((alwaysAppendSuffix || force) && !slug.endsWith(`-${currentLocale}`)) {
        return `${slug}-${currentLocale}`;
      }
    }
    return slug;
  };

  useEffect(() => {
    if (!hasSourceField) {
      setError(
        formatMessage({ id: getTranslation('input.error.sourceMissing') }, { source: sourceField })
      );
      setIsValid(false);
    } else {
      setError(null);
    }
  }, [hasSourceField, sourceField, formatMessage]);

  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location?.search);
    const locale = params?.get('plugins[i18n][locale]');
    setCurrentLocale(locale || '');
  }, [location]);

  const checkSlugApi = async (slugToCheck: string): Promise<{ isValid: boolean; message?: string }> => {
    try {
      const response = await post(`/${PLUGIN_ID}/check-slug`, {
        id,
        slug: slugToCheck,
        key,
        uid,
        currentLocale,
        locale: currentLocale,
      });

      const data = response?.data;
      const result = data?.result || data?.data?.result;

      if (!result) throw new Error('Invalid response format');

      return {
        isValid: result.isValid,
        message: result.message
      };
    } catch (error) {
      console.error('Check API error:', error);
      return { isValid: false, message: formatMessage({ id: getTranslation('input.error.checkFailed') }) };
    }
  };

  const validateSlug = async (slug: string) => {
    setIsLoading(true);

    const { isValid: slugIsValid, message } = await checkSlugApi(slug);

    setIsLoading(false);

    if (!slugIsValid) {
      setError(message || formatMessage({ id: getTranslation('input.error.invalid') }));
      setIsValid(false);
      setReGenerate(true);
      return false;
    }

    setError(null);
    setIsValid(true);
    setReGenerate(false);
    return true;
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputSlug(newValue);
    setIsValid(null);
    setIsManuallyEdited(true);

    if (!newValue?.trim() && attribute?.required) {
      setError(formatMessage({ id: getTranslation('input.error.empty') }));
      setIsValid(false);
      setInputSlug('');
      onChange?.({ target: { name, value: '' } });
      return;
    }

    const fullSlug = ensureLocaleInSlug(newValue);
    const isValidSlug = await validateSlug(fullSlug);
    if (isValidSlug) {
      onChange?.({ target: { name, value: fullSlug } });
      setTimeout(() => setIsValid(null), CONSTANTS.SUCCESS_MSG_DELAY);
    }
  };

  const performSlugGeneration = async (sourceValue: string, isManual: boolean = false) => {
    if (!sourceValue) {
      if (isManual) {
        setError(formatMessage({ id: getTranslation('input.error.noContent') }, { source: sourceFieldRef.current }));
      }
      return;
    }

    if (typeof sourceValue !== 'string' || !sourceValue.trim()) {
      if (isManual) {
        setError(formatMessage({ id: getTranslation('input.error.mustString') }, { source: sourceFieldRef.current }));
      }
      return;
    }

    if (!isManual && lastSourceValueRef.current === sourceValue.trim()) {
      return;
    }

    setIsLoading(true);
    if (!isManual) {
      setIsAutoGenerating(true);
    }

    try {
      const currentContext = contextRef.current;

      const response = await post(`/${PLUGIN_ID}/generate`, {
        text: sourceValue.trim(),
        mode: currentContext.attribute?.options?.mode || 'translation',
        targetLang: currentContext.attribute?.options?.targetLang || 'en',
      });

      if (response?.data?.data?.slug) {
        const baseSlug = response.data.data.slug;
        let finalSlug = baseSlug;

        if (isI18nEnabled && currentLocale) {
          if (alwaysAppendSuffix) {
            finalSlug = ensureLocaleInSlug(baseSlug, true);
          } else {
            const { isValid } = await checkSlugApi(baseSlug);
            finalSlug = isValid ? baseSlug : ensureLocaleInSlug(baseSlug, true);
          }
        } else {
          finalSlug = baseSlug;
        }

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
        setError(formatMessage({ id: getTranslation('input.error.generateFailed') }));

        const localSlug = slugify(sourceValue);
        const finalSlug = ensureLocaleInSlug(localSlug, true);

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

  const { debouncedCallback: debouncedGenerateSlug } = useDebounce(
    (sourceValue: string) => {
      performSlugGeneration(sourceValue, false);
    },
    CONSTANTS.DEBOUNCE_DELAY
  );

  useEffect(() => {
    const sourceValue = modifiedData?.[sourceField];
    const initialSourceValue = initialValues?.[sourceField];

    if (isManuallyEdited) {
      return;
    }

    if (
      sourceValue &&
      typeof sourceValue === 'string' &&
      sourceValue.trim() &&
      sourceValue !== initialSourceValue &&
      sourceValue.trim() !== lastSourceValueRef.current
    ) {
      debouncedGenerateSlug(sourceValue);
    }
  }, [modifiedData?.[sourceField], sourceField, initialValues?.[sourceField], debouncedGenerateSlug, isManuallyEdited]);

  const handleReGenerate = async () => {
    const sourceValue = modifiedData?.[sourceField];
    if (sourceValue) {
      setIsLoading(true);
      setIsManuallyEdited(false);
      try {
        const counter = Math.floor(Math.random() * 1000);
        const textToTranslate = `${sourceValue}`;

        const response = await post(`/${PLUGIN_ID}/generate`, {
          text: textToTranslate,
          mode: attribute?.options?.mode || 'translation',
          targetLang: attribute?.options?.targetLang || 'en',
        });

        if (response?.data?.data?.slug) {
          const baseSlug = response.data.data.slug;
          let finalSlug = baseSlug;

          if (isI18nEnabled && currentLocale) {
            if (alwaysAppendSuffix) {
              finalSlug = ensureLocaleInSlug(baseSlug, true);
            } else {
              const { isValid } = await checkSlugApi(baseSlug);
              finalSlug = !isValid ? ensureLocaleInSlug(baseSlug, true) : baseSlug;
            }
          }

          const finalCheck = await checkSlugApi(finalSlug);
          if (!finalCheck.isValid) {
            finalSlug = `${finalSlug}-${counter}`;
          }

          setInputSlug(finalSlug);
          onChange?.({ target: { name, value: finalSlug } });
          await validateSlug(finalSlug);

        } else {
          const localSlug = slugify(`${sourceValue}-${counter}`);
          const finalSlug = ensureLocaleInSlug(localSlug, true);
          setInputSlug(finalSlug);
          onChange?.({ target: { name, value: finalSlug } });
          await validateSlug(finalSlug);
        }
      } catch (error) {
        console.error('Error regenerating slug:', error);
        const counter = Math.floor(Math.random() * 1000);
        const localSlug = slugify(sourceValue + `-${counter}`);
        const finalSlug = ensureLocaleInSlug(localSlug, true);
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
      setIsManuallyEdited(false);
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
          {formatMessage({ id: getTranslation('input.hint.description') }, { source: sourceField })}
          {isAutoGenerating && (
            <span style={{ color: CONSTANTS.COLORS.WARNING, marginLeft: '8px' }}>
              ⏳ {formatMessage({ id: getTranslation('input.status.autoGenerating') })}
            </span>
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
                      <LoadingIcon />
                      {formatMessage({ id: getTranslation('input.status.generating') })}
                    </span>
                  </StyledFieldContainer>
                ) : isValid ? (
                  <StyledFieldContainer>
                    <span className="available-icon-text">
                      <SuccessIcon />
                      {formatMessage({ id: getTranslation('input.status.available') })}
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
            backgroundColor: CONSTANTS.COLORS.PRIMARY,
            color: CONSTANTS.COLORS.WHITE,
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            whiteSpace: 'nowrap',
          }}
        >
          {formatMessage({ id: getTranslation('input.button.generate') })}
        </button>
      </div>

      <Field.Hint>
        {formatMessage(
          { id: getTranslation('input.hint.details') },
          { delay: CONSTANTS.DEBOUNCE_DELAY, mode: attribute?.options?.mode || 'translation' }
        )}
        {isI18nEnabled && currentLocale && ` | ${formatMessage({ id: getTranslation('input.hint.i18n') }, { locale: currentLocale })}`}
      </Field.Hint>
      {error && <Field.Error>{error}</Field.Error>}
    </Field.Root>
  );
};

export default SlugInput;

// --- Sub Components (Icons) ---
const LoadingIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    width="1rem"
    height="1rem"
    fill={CONSTANTS.COLORS.WARNING}
    className="loading-icon"
  >
    <path
      fill={CONSTANTS.COLORS.WARNING}
      d="M17.5 4v4a1.5 1.5 0 1 1-3 0V4a1.5 1.5 0 1 1 3 0m4.156 7.844a1.5 1.5 0 0 0 1.062-.44l2.828-2.829a1.503 1.503 0 1 0-2.125-2.125l-2.825 2.833a1.5 1.5 0 0 0 1.06 2.56M28 14.5h-4a1.5 1.5 0 1 0 0 3h4a1.5 1.5 0 1 0 0-3m-5.282 6.096a1.501 1.501 0 0 0-2.451 1.638c.075.182.186.348.326.487l2.828 2.829a1.503 1.503 0 0 0 2.125-2.125zM16 22.5a1.5 1.5 0 0 0-1.5 1.5v4a1.5 1.5 0 1 0 3 0v-4a1.5 1.5 0 0 0-1.5-1.5m-6.717-1.904-2.83 2.829A1.503 1.503 0 0 0 8.58 25.55l2.829-2.829a1.503 1.503 0 0 0-2.125-2.125M9.5 16A1.5 1.5 0 0 0 8 14.5H4a1.5 1.5 0 1 0 0 3h4A1.5 1.5 0 0 0 9.5 16m-.925-9.546A1.503 1.503 0 0 0 6.45 8.579l2.833 2.825a1.503 1.503 0 0 0 2.125-2.125z"
    />
  </svg>
);

const SuccessIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1rem"
    height="1rem"
    fill="none"
    viewBox="0 0 24 24"
    className="available-icon"
  >
    <path
      fill={CONSTANTS.COLORS.SUCCESS}
      fillRule="evenodd"
      d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12Zm-1.438-11.066L16.158 7.5 18 9.245l-7.438 7.18-4.462-4.1 1.84-1.745 2.622 2.354Z"
      clipRule="evenodd"
    />
  </svg>
);

const StyledFieldContainer = styled.div<{ theme?: Theme }>`
  svg {
    height: 1rem;
    width: 1rem;
    path {
      fill: ${({ theme }) => theme?.colors?.neutral400 || CONSTANTS.COLORS.NEUTRAL};
    }
  }
  &:hover svg path {
    fill: ${({ theme }) => theme?.colors?.primary600 || CONSTANTS.COLORS.PRIMARY};
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
        fill: ${({ theme }) => theme?.colors?.warning500 || CONSTANTS.COLORS.WARNING};
      }
      path:last-of-type {
        fill: ${({ theme }) => theme?.colors?.warning500 || CONSTANTS.COLORS.WARNING};
      }
    }
  }

  .loading-icon {
    path {
      fill: ${({ theme }) => theme?.colors?.warning500 || CONSTANTS.COLORS.WARNING};
    }
    animation: spin 1s linear infinite;
  }

  .available-icon {
    path {
      fill: ${({ theme }) => theme?.colors?.success500 || CONSTANTS.COLORS.SUCCESS};
    }
  }

  .loading-icon-text,
  .available-icon-text {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    color: ${({ theme }) => theme?.colors?.warning500 || CONSTANTS.COLORS.WARNING};
  }

  .available-icon-text {
    animation: fadeInOut 3s ease-in-out;
    color: ${({ theme }) => theme?.colors?.success500 || CONSTANTS.COLORS.SUCCESS};
  }

  .loading-icon-text {
    animation: fadeInOut 3s ease-in-out;
    color: ${({ theme }) => theme?.colors?.warning500 || CONSTANTS.COLORS.WARNING};
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
