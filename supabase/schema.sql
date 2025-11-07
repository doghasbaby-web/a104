-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Diagrams table
CREATE TABLE IF NOT EXISTS public.diagrams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
    connections JSONB NOT NULL DEFAULT '[]'::jsonb,
    config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Test cases table
CREATE TABLE IF NOT EXISTS public.test_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    diagram_id UUID REFERENCES public.diagrams(id) ON DELETE CASCADE NOT NULL,
    block_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    inputs JSONB NOT NULL,
    expected_outputs JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Test results table
CREATE TABLE IF NOT EXISTS public.test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_case_id UUID REFERENCES public.test_cases(id) ON DELETE CASCADE NOT NULL,
    passed BOOLEAN NOT NULL,
    actual_outputs JSONB,
    error TEXT,
    execution_time INTEGER NOT NULL, -- in milliseconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Generated code table
CREATE TABLE IF NOT EXISTS public.generated_code (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    diagram_id UUID REFERENCES public.diagrams(id) ON DELETE CASCADE NOT NULL,
    language TEXT NOT NULL,
    code TEXT NOT NULL,
    orchestration_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Block templates table (for reusable blocks)
CREATE TABLE IF NOT EXISTS public.block_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    block_type TEXT NOT NULL,
    language TEXT,
    inputs JSONB NOT NULL,
    outputs JSONB NOT NULL,
    internal TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Execution logs table
CREATE TABLE IF NOT EXISTS public.execution_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    diagram_id UUID REFERENCES public.diagrams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL, -- success, error, running
    inputs JSONB,
    outputs JSONB,
    error TEXT,
    execution_time INTEGER, -- in milliseconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes
CREATE INDEX idx_diagrams_user_id ON public.diagrams(user_id);
CREATE INDEX idx_test_cases_diagram_id ON public.test_cases(diagram_id);
CREATE INDEX idx_test_results_test_case_id ON public.test_results(test_case_id);
CREATE INDEX idx_generated_code_diagram_id ON public.generated_code(diagram_id);
CREATE INDEX idx_block_templates_user_id ON public.block_templates(user_id);
CREATE INDEX idx_execution_logs_diagram_id ON public.execution_logs(diagram_id);
CREATE INDEX idx_execution_logs_user_id ON public.execution_logs(user_id);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagrams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_code ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.block_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Diagrams policies
CREATE POLICY "Users can view own diagrams"
    ON public.diagrams FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own diagrams"
    ON public.diagrams FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own diagrams"
    ON public.diagrams FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own diagrams"
    ON public.diagrams FOR DELETE
    USING (auth.uid() = user_id);

-- Test cases policies
CREATE POLICY "Users can view test cases for own diagrams"
    ON public.test_cases FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.diagrams
            WHERE diagrams.id = test_cases.diagram_id
            AND diagrams.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create test cases for own diagrams"
    ON public.test_cases FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.diagrams
            WHERE diagrams.id = test_cases.diagram_id
            AND diagrams.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update test cases for own diagrams"
    ON public.test_cases FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.diagrams
            WHERE diagrams.id = test_cases.diagram_id
            AND diagrams.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete test cases for own diagrams"
    ON public.test_cases FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.diagrams
            WHERE diagrams.id = test_cases.diagram_id
            AND diagrams.user_id = auth.uid()
        )
    );

-- Test results policies
CREATE POLICY "Users can view test results for own test cases"
    ON public.test_results FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.test_cases tc
            JOIN public.diagrams d ON tc.diagram_id = d.id
            WHERE tc.id = test_results.test_case_id
            AND d.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create test results for own test cases"
    ON public.test_results FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.test_cases tc
            JOIN public.diagrams d ON tc.diagram_id = d.id
            WHERE tc.id = test_results.test_case_id
            AND d.user_id = auth.uid()
        )
    );

-- Generated code policies
CREATE POLICY "Users can view generated code for own diagrams"
    ON public.generated_code FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.diagrams
            WHERE diagrams.id = generated_code.diagram_id
            AND diagrams.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create generated code for own diagrams"
    ON public.generated_code FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.diagrams
            WHERE diagrams.id = generated_code.diagram_id
            AND diagrams.user_id = auth.uid()
        )
    );

-- Block templates policies
CREATE POLICY "Users can view own and public block templates"
    ON public.block_templates FOR SELECT
    USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create own block templates"
    ON public.block_templates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own block templates"
    ON public.block_templates FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own block templates"
    ON public.block_templates FOR DELETE
    USING (auth.uid() = user_id);

-- Execution logs policies
CREATE POLICY "Users can view own execution logs"
    ON public.execution_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own execution logs"
    ON public.execution_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Functions

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_diagrams
    BEFORE UPDATE ON public.diagrams
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_test_cases
    BEFORE UPDATE ON public.test_cases
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_block_templates
    BEFORE UPDATE ON public.block_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
