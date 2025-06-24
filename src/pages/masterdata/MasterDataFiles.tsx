import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { SnackbarProvider, enqueueSnackbar } from 'notistack';
import { Alert, Button, DialogActions, DialogContent, IconButton, InputLabel, Skeleton, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { DataGrid, GridColDef, GridRenderCellParams, GridToolbar } from '@mui/x-data-grid';
import { sizingStyles, gridStyles, BootstrapDialog, BootstrapDialogTitle, buttonCloseStyles, actionButtonStyles, inputLabelStyles } from '../../utils/misc/styles';
import { Delete, Download } from '@mui/icons-material';
import { MuiFileInput } from 'mui-file-input';
import { useTranslation } from 'react-i18next';
import { base64ToUint8Array } from '../../utils/functions';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteApiFileByFolderByFileNameMutation, getApiFileByFolderByFileNameOptions, getApiFileByFolderOptions, postApiFileUploadMutation } from '../../api/client/document/@tanstack/react-query.gen';

const MasterDataFiles: any = () => {
    const [loadResults, setLoadResults] = useState<boolean>(true);
    // const [loadEdit, setLoadEdit] = useState<boolean>(false);
    const [modal, setModal] = useState<boolean>(false);
    const [modal2, setModal2] = useState<boolean>(false);
    const [currentId, setCurrentId] = useState<string>("");
    const [currentEditId, setCurrentEditId] = useState<string>("");
    const [fileValue, setFileValue] = useState<File[] | undefined>(undefined);
    
    const { t } = useTranslation();

    const queryClient = useQueryClient();

    const {data: files, isFetching} = useQuery({
        ...getApiFileByFolderOptions({path: {folder: "Standard"}}),
    })

    const postFileUploadMutation = useMutation({
        ...postApiFileUploadMutation(),
        onSuccess: () => {
            enqueueSnackbar(t('fileAdded'), { variant: "success", anchorOrigin: { horizontal: "right", vertical: "top"} });
            getFiles();
            setModal(false);
        },
        onError: () => {
            enqueueSnackbar(t('errorHappened'), { variant: "error", anchorOrigin: { horizontal: "right", vertical: "top"} });
        }
    })

    const deleteFileByFolderByFileNameMutation = useMutation({
        ...deleteApiFileByFolderByFileNameMutation(),
        onSuccess: () => {
            enqueueSnackbar(t('rowDeletedSuccess'), { variant: "success", anchorOrigin: { horizontal: "right", vertical: "top"} });
            setModal2(false);
            getFiles();
        },
        onError: () => {
            enqueueSnackbar(t('rowDeletedError'), { variant: "error", anchorOrigin: { horizontal: "right", vertical: "top"} });
        }
    })

    useEffect(() => {
        setLoadResults(isFetching);
    }, [isFetching])
    
    
    const getFiles = async () => {
        queryClient.invalidateQueries({ queryKey: getApiFileByFolderOptions({path: {folder: "Standard"}}).queryKey });
    }
    
    const deleteFile = async (id: string) => {
        await deleteFileByFolderByFileNameMutation.mutateAsync({path: {folder: "Standard", fileName: id.replace("Standard", "")}})
    }

    const columnsFiles: GridColDef[] = [
        // { field: 'id', headerName: t('id'), flex: 1 },
        { field: 'blobName', headerName: t('fileName'), flex: 3 },
        { field: 'contentType', headerName: t('contentType'), flex: 1 },
        // { field: 'size', headerName: t('size'), flex: 1 },
        // { field: 'uploadedAt', headerName: t('uploadedAt'), renderCell: (params: GridRenderCellParams) => {
        //     return (
        //         <Box sx={{ my: 1, mr: 1 }}>
        //             {params.row.uploadedAt !== null ? (new Date(params.row.uploadedAt)).toLocaleString() : null}
        //         </Box>
        //     );
        // }, flex: 1 },
        { field: 'xxx', headerName: t('Actions'), renderCell: (params: GridRenderCellParams) => {
            return (
                <Box sx={{ my: 1, mr: 1 }}>
                    <IconButton size="small" title={t('downloadFile')} sx={{ mr: 0.5 }} onClick={() => { downloadFile(params.row.blobName, params.row.contentType); }}>
                        <Download fontSize="small" />
                    </IconButton>
                    <IconButton size="small" title={t('deleteRowFile')} onClick={() => { setCurrentId(params.row.blobName); setModal2(true); }}>
                        <Delete fontSize="small" />
                    </IconButton>
                </Box>
            );
        }, minWidth: 120, flex: 1 },
    ];
    
    const uploadFile = async () => {
        if (fileValue !== undefined && fileValue !== null) {
            await postFileUploadMutation.mutateAsync({query: {folder: "Standard"}, body: {file:  fileValue[0]}})
        }
        else {
            enqueueSnackbar("The file field is empty, please verify it and pick a file.", { variant: "warning", anchorOrigin: { horizontal: "right", vertical: "top"} });
        }
    };

    const downloadFile = async (name: string, type: string) => {
        try {
            const response = await queryClient.fetchQuery(
                getApiFileByFolderByFileNameOptions({path: {folder: "Standard", fileName: name.replace("Standard", "")}}))
            
            if(response.fileBase64){
                const decodedData = base64ToUint8Array(response.fileBase64.replace(/^data:[^;]+;base64,/, ""));
                const url = window.URL.createObjectURL(new File([decodedData], name, {type: type}));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', name.replace("Standard", "")); // replace with your file name and extension
                document.body.appendChild(link);
                link.click();
                link.parentNode?.removeChild(link);
            }
            
        } 
        catch (error: any) {
            
        }
    };
    
    const resetForm = () => {
        setFileValue(undefined);
    }
    
    return (
        <div style={{ background: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
            <SnackbarProvider />
            <Box py={2.5}>
                <Grid container spacing={2} mt={0} px={5}>
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Typography sx={{ fontSize: 18, mb: 1 }}><b>{t('listFiles')}</b></Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Button 
                            variant="contained" color="inherit" 
                            sx={{ float: "right", backgroundColor: "#fff", textTransform: "none", ml: 2 }} 
                            onClick={() => { getFiles(); }} 
                        >
                            {t('reload')}
                        </Button>
                        <Button 
                            variant="contained" color="inherit" 
                            sx={{ float: "right", backgroundColor: "#fff", textTransform: "none" }} 
                            onClick={() => { setCurrentEditId(""); resetForm(); setModal(true); }} 
                        >
                            {t('newFile')}
                        </Button>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        {
                            !loadResults ? 
                            files && files.length > 0 ?
                            <Box sx={{ overflow: "auto" }}>
                                <DataGrid
                                    rows={files}
                                    columns={columnsFiles}
                                    // hideFooter
                                    initialState={{
                                        pagination: {
                                            paginationModel: {
                                                pageSize: 10,
                                            },
                                        },
                                    }}
                                    pageSizeOptions={[5, 10, 25, 50]}
                                    getRowId={(row: any) => row?.blobName}
                                    getRowHeight={() => "auto" }
                                    style={sizingStyles}
                                    sx={gridStyles}
                                    disableDensitySelector
                                    disableColumnSelector
                                    slots={{ toolbar: GridToolbar }}
                                    slotProps={{
                                        toolbar: {
                                            showQuickFilter: true,
                                        },
                                    }}
                                    disableRowSelectionOnClick
                                    // onRowClick={handleRowSeafreightsClick}
                                />
                            </Box> : 
                            <Box>
                                <Alert severity="error">{t('noResults')}</Alert>
                            </Box>
                            : <Skeleton />
                        }
                    </Grid>
                </Grid>
            </Box>

            <BootstrapDialog
                onClose={() => setModal(false)}
                aria-labelledby="custom-dialog-title"
                open={modal}
                maxWidth="sm"
                fullWidth
            >
                <BootstrapDialogTitle id="custom-dialog-title7" onClose={() => setModal(false)}>
                    <b>{currentEditId === "" ? t('createRowFile') : t('editRowFile')}</b>
                </BootstrapDialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                            <InputLabel htmlFor="fileSent" sx={inputLabelStyles}>{t('fileSent')}</InputLabel>
                            <MuiFileInput
                                id="fileSent" size="small" 
                                variant="outlined" multiple fullWidth /*inputProps={{ accept: '.pdf' }}*/
                                value={fileValue} sx={{ mt: 1 }} 
                                onChange={(newValue: any) => { console.log(newValue); setFileValue(newValue); }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button variant="contained" onClick={() => { uploadFile(); }} sx={actionButtonStyles}>{t('validate')}</Button>
                    <Button variant="contained" onClick={() => setModal(false)} sx={buttonCloseStyles}>{t('close')}</Button>
                </DialogActions>
            </BootstrapDialog>

            <BootstrapDialog
                onClose={() => setModal2(false)}
                aria-labelledby="custom-dialog-title"
                open={modal2}
                maxWidth="sm"
                fullWidth
            >
                <BootstrapDialogTitle id="custom-dialog-title" onClose={() => setModal2(false)}>
                    <b>{t('deleteRowFile')}</b>
                </BootstrapDialogTitle>
                <DialogContent dividers>{t('areYouSureDeleteRow')}</DialogContent>
                <DialogActions>
                    <Button variant="contained" color={"primary"} onClick={() => { deleteFile(currentId); }} sx={{ mr: 1.5, textTransform: "none" }}>{t('accept')}</Button>
                    <Button variant="contained" onClick={() => setModal2(false)} sx={buttonCloseStyles}>{t('close')}</Button>
                </DialogActions>
            </BootstrapDialog>
        </div>
    );
}

export default MasterDataFiles;