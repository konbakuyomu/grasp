function normalizeText(value) {
  if (Array.isArray(value)) {
    return value.filter((line) => line !== undefined && line !== null && line !== '').join('\n');
  }

  return String(value ?? '');
}

export function textResponse(value, meta) {
  const response = {
    content: [
      {
        type: 'text',
        text: normalizeText(value),
      },
    ],
  };

  if (meta !== undefined) {
    response.meta = meta;
  }

  return response;
}

export function errorResponse(value, meta) {
  return {
    ...textResponse(value, meta),
    isError: true,
  };
}

export function imageResponse(data, mimeType = 'image/png') {
  return {
    content: [
      {
        type: 'image',
        data,
        mimeType,
      },
    ],
  };
}
