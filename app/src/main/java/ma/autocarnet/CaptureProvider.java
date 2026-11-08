package ma.autocarnet;
import android.content.*;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;
import java.io.*;

public class CaptureProvider extends ContentProvider {
  public boolean onCreate(){return true;}
  private File file(Uri uri) throws FileNotFoundException {
    if(uri.getPath()!=null&&uri.getPath().matches("/pocket/[a-f0-9]{64}\\.pdf"))return new File(new File(getContext().getFilesDir(),"photos"),uri.getLastPathSegment());
    if(!"/capture.jpg".equals(uri.getPath()))throw new FileNotFoundException();
    return new File(getContext().getCacheDir(),"capture.jpg");
  }
  public ParcelFileDescriptor openFile(Uri uri,String mode) throws FileNotFoundException {if(uri.getPath()!=null&&uri.getPath().startsWith("/pocket/")&&!"r".equals(mode))throw new FileNotFoundException();return ParcelFileDescriptor.open(file(uri),ParcelFileDescriptor.parseMode(mode));}
  public String getType(Uri uri){return uri.getPath().endsWith(".pdf")?"application/pdf":"image/jpeg";}
  public Cursor query(Uri uri,String[] projection,String selection,String[] args,String order){
    File checked;try{checked=file(uri);}catch(FileNotFoundException e){return null;}
    String[] cols=projection==null?new String[]{OpenableColumns.DISPLAY_NAME,OpenableColumns.SIZE}:projection;
    MatrixCursor cursor=new MatrixCursor(cols);Object[] values=new Object[cols.length];
    for(int i=0;i<cols.length;i++)values[i]=cols[i].equals(OpenableColumns.DISPLAY_NAME)?uri.getLastPathSegment():cols[i].equals(OpenableColumns.SIZE)?checked.length():null;
    cursor.addRow(values);return cursor;
  }
  public Uri insert(Uri u,ContentValues v){throw new UnsupportedOperationException();}
  public int update(Uri u,ContentValues v,String s,String[] a){throw new UnsupportedOperationException();}
  public int delete(Uri u,String s,String[] a){throw new UnsupportedOperationException();}
}
